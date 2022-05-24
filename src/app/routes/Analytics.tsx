import { IGossipMetrics } from "@iota/iota.js";
import React, { ReactNode } from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { ServiceFactory } from "../../factories/serviceFactory";
import { IAvgSpamMetrics } from "../../models/websocket/IAvgSpamMetrics";
import { IBpsMetrics } from "../../models/websocket/IBpsMetrics";
import { IConfirmedMsMetrics } from "../../models/websocket/IConfirmedMsMetrics";
import { IDBSizeMetric } from "../../models/websocket/IDBSizeMetric";
import { INodeStatus } from "../../models/websocket/INodeStatus";
import { ISpamMetrics } from "../../models/websocket/ISpamMetrics";
import { WebSocketTopic } from "../../models/websocket/webSocketTopic";
import { AuthService } from "../../services/authService";
import { MetricsService } from "../../services/metricsService";
import { DataHelper } from "../../utils/dataHelper";
import AsyncComponent from "../components/layout/AsyncComponent";
import Graph from "../components/layout/Graph";
import TabPanel from "../components/layout/TabPanel";
import Spammer from "../components/plugins/Spammer";
import "./Analytics.scss";
import { AnalyticsRouteProps } from "./AnalyticsRouteProps";
import { AnalyticsState } from "./AnalyticsState";

/**
 * Analytics panel.
 */
class Analytics extends AsyncComponent<RouteComponentProps<AnalyticsRouteProps>, AnalyticsState> {
    /**
     * Number of bytes in a MB.
     */
    private static readonly BYTES_PER_MB: number = 1000 * 1000;

    /**
     * Number of bytes in a MiB.
     */
    private static readonly BYTES_PER_MIB: number = 1024 * 1024;

    /**
     * The metrics service.
     */
    private readonly _metricsService: MetricsService;

    /**
     * The bps metrics subscription id.
     */
    private _bpsMetricsSubscription?: string;

    /**
     * The confirmed ms subscription id.
     */
    private _confirmedMsMetricsSubscription?: string;

    /**
     * The status subscription id.
     */
    private _statusSubscription?: string;

    /**
     * The database size metrics subscription id.
     */
    private _databaseSizeSubscription?: string;

    /**
     * The spam average metrics subscription id.
     */
    private _spamAvgSubscription?: string;

    /**
     * The spam metrics subscription id.
     */
    private _spamSubscription?: string;

    /**
     * The auth service.
     */
    private readonly _authService: AuthService;

    /**
     * Create a new instance of Analytics.
     * @param props The props.
     */
    constructor(props: RouteComponentProps<AnalyticsRouteProps>) {
        super(props);

        this._metricsService = ServiceFactory.get<MetricsService>("metrics");
        this._authService = ServiceFactory.get<AuthService>("auth");

        const isSpammerAvailable = Boolean(Spammer.pluginDetails());

        this.state = {
            tabs: this.calculateTabs(isSpammerAvailable),
            activeTab: this.props.match.params.section ?? "tangle",
            bpsIncoming: [],
            bpsOutgoing: [],
            lastReceivedBpsTime: 0,
            averageMilestoneTime: 0,
            lastMsReceivedTime: 0,
            milestoneTiming: [],
            bps: [],
            rbps: [],
            lastStatusReceivedTime: 0,
            lastDbInterval: 1000,
            memorySize: [],
            lastStatusInterval: 1000,
            lastDbReceivedTime: 0,
            databaseSize: [],
            isSpammerAvailable,
            lastSpamAvgReceivedTime: 0,
            spamNewBlocks: [],
            spamAvgBlocks: [],
            lastSpamReceivedTime: 0,
            lastSpamInterval: 0,
            lastSpamIntervals: [],
            tipSelection: [],
            pow: [],
            requestQueue: {
                queued: [],
                pending: [],
                processing: [],
                averageLatency: []
            },
            memory: {
                stackAlloc: [],
                heapReleased: [],
                heapInUse: [],
                heapIdle: [],
                heapSys: [],
                totalAlloc: []
            },
            caches: {
                requestQueue: [],
                children: [],
                milestones: [],
                blocks: [],
                IncomingBlocksWorkUnits: []
            }
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        super.componentDidMount();

        this._bpsMetricsSubscription = this._metricsService.subscribe<IBpsMetrics>(
            WebSocketTopic.BPSMetrics,
            undefined,
            allData => {
                const nonNull = allData.filter(d => d !== undefined && d !== null);
                this.setState({
                    lastReceivedBpsTime: Date.now(),
                    bpsIncoming: nonNull.map(m => m.incoming),
                    bpsOutgoing: nonNull.map(m => m.outgoing)
                });
            }
        );

        this._confirmedMsMetricsSubscription = this._metricsService.subscribe<IConfirmedMsMetrics>(
            WebSocketTopic.ConfirmedMsMetrics,
            undefined,
            allData => {
                const nonNull = allData.filter(d => d !== undefined && d !== null);
                let ts = 0;
                for (let i = 0; i < nonNull.length; i++) {
                    ts += nonNull[i].time_since_last_ms;
                }
                this.setState({
                    averageMilestoneTime: ts / nonNull.length * 1000,
                    lastMsReceivedTime: Date.now(),
                    milestoneTiming: nonNull.map(m => m.time_since_last_ms),
                    bps: nonNull.map(m => m.bps * m.time_since_last_ms),
                    rbps: nonNull.map(m => m.rbps * m.time_since_last_ms)
                });
            }
        );

        this._statusSubscription = this._metricsService.subscribe<INodeStatus>(
            WebSocketTopic.NodeStatus,
            undefined,
            allData => {
                const nonNull = allData.filter(d => d !== undefined && d !== null);

                this.setState({
                    memorySize: nonNull.map(d => DataHelper.calculateMemoryUsage(d) / Analytics.BYTES_PER_MIB),
                    lastStatusReceivedTime: Date.now(),
                    lastStatusInterval: this.state.lastStatusReceivedTime === 0
                        ? 1000 : Date.now() - this.state.lastStatusReceivedTime
                });

                if (nonNull.length > 0) {
                    const data = nonNull[nonNull.length - 1];
                    const gossipMetrics: IGossipMetrics = {
                        newBlocks: data.serverMetrics.newBlocks,
                        knownBlocks: data.serverMetrics.knownBlocks,
                        receivedBlocks: data.serverMetrics.knownBlocks + data.serverMetrics.newBlocks,
                        receivedBlockRequests: data.serverMetrics.receivedBlockRequests,
                        receivedMilestoneRequests: data.serverMetrics.receivedMilestoneRequests,
                        receivedHeartbeats: data.serverMetrics.receivedHeartbeats,
                        sentBlocks: data.serverMetrics.sentBlocks,
                        sentBlockRequests: data.serverMetrics.sentBlockRequests,
                        sentMilestoneRequests: data.serverMetrics.sentMilestoneRequests,
                        sentHeartbeats: data.serverMetrics.sentHeartbeats,
                        droppedPackets: data.serverMetrics.droppedSentPackets
                    };

                    this.setState({ gossipMetrics });
                }

                this.setState({
                    requestQueue: {
                        queued: nonNull.map(d => d.requestQueueQueued),
                        pending: nonNull.map(d => d.requestQueuePending),
                        processing: nonNull.map(d => d.requestQueueProcessing),
                        averageLatency: nonNull.map(d => d.requestQueueAvgLatency)
                    }
                });

                this.setState({
                    memory: {
                        stackAlloc: nonNull.map(d => d.mem.stackSys / Analytics.BYTES_PER_MIB),
                        heapReleased: nonNull.map(d => d.mem.heapReleased / Analytics.BYTES_PER_MIB),
                        heapInUse: nonNull.map(d => d.mem.heapInUse / Analytics.BYTES_PER_MIB),
                        heapIdle: nonNull.map(d => d.mem.heapIdle / Analytics.BYTES_PER_MIB),
                        heapSys: nonNull.map(d => d.mem.heapSys / Analytics.BYTES_PER_MIB),
                        totalAlloc: nonNull.map(d => d.mem.sys / Analytics.BYTES_PER_MIB)
                    }
                });

                this.setState({
                    caches: {
                        requestQueue: nonNull.map(d => d.caches.requestQueue.size),
                        children: nonNull.map(d => d.caches.children.size),
                        milestones: nonNull.map(d => d.caches.milestones.size),
                        blocks: nonNull.map(d => d.caches.blocks.size),
                        IncomingBlocksWorkUnits: nonNull.map(d => d.caches.incomingBlocksWorkUnits.size)
                    }
                });
            });

        this._databaseSizeSubscription = this._metricsService.subscribe<IDBSizeMetric>(
            WebSocketTopic.DBSizeMetric,
            undefined,
            allData => {
                const nonNull = allData.filter(d => d !== undefined && d !== null);

                this.setState({
                    databaseSize: nonNull.map(d => d.total / Analytics.BYTES_PER_MB),
                    lastDbReceivedTime: Date.now(),
                    lastDbInterval: this.state.lastDbReceivedTime === 0
                        ? 60000 : Date.now() - this.state.lastDbReceivedTime
                });
            });

        this._spamSubscription = this._metricsService.subscribe<ISpamMetrics>(
            WebSocketTopic.SpamMetrics,
            undefined,
            allData => {
                const nonNull = allData.filter(d => d !== undefined && d !== null);

                const thisSpamInterval = this.state.lastSpamReceivedTime === 0
                    ? 100 : Date.now() - this.state.lastSpamReceivedTime;

                const lastSpamIntervals = this.state.lastSpamIntervals.slice();
                lastSpamIntervals.push(thisSpamInterval);

                let totalInterval = 0;
                for (let i = 0; i < lastSpamIntervals.length; i++) {
                    totalInterval += lastSpamIntervals[i];
                }
                totalInterval /= lastSpamIntervals.length;

                this.setState({
                    tipSelection: nonNull.map(d => d.tipselect * 1000000),
                    pow: nonNull.map(d => d.pow),
                    lastSpamReceivedTime: Date.now(),
                    lastSpamInterval: totalInterval,
                    lastSpamIntervals
                });
            });

        this._spamAvgSubscription = this._metricsService.subscribe<IAvgSpamMetrics>(
            WebSocketTopic.AvgSpamMetrics,
            undefined,
            allData => {
                const nonNull = allData.filter(d => d !== undefined && d !== null);

                this.setState({
                    spamNewBlocks: nonNull.map(d => d.newBlocks),
                    spamAvgBlocks: nonNull.map(d => d.avgBlocks),
                    lastSpamAvgReceivedTime: Date.now()
                });
            });
    }

    /**
     * The component will unmount.
     */
    public componentWillUnmount(): void {
        super.componentWillUnmount();

        if (this._bpsMetricsSubscription) {
            this._metricsService.unsubscribe(this._bpsMetricsSubscription);
            this._bpsMetricsSubscription = undefined;
        }

        if (this._confirmedMsMetricsSubscription) {
            this._metricsService.unsubscribe(this._confirmedMsMetricsSubscription);
            this._confirmedMsMetricsSubscription = undefined;
        }

        if (this._statusSubscription) {
            this._metricsService.unsubscribe(this._statusSubscription);
            this._statusSubscription = undefined;
        }

        if (this._databaseSizeSubscription) {
            this._metricsService.unsubscribe(this._databaseSizeSubscription);
            this._databaseSizeSubscription = undefined;
        }

        if (this._spamAvgSubscription) {
            this._metricsService.unsubscribe(this._spamAvgSubscription);
            this._spamAvgSubscription = undefined;
        }

        if (this._spamSubscription) {
            this._metricsService.unsubscribe(this._spamSubscription);
            this._spamSubscription = undefined;
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="analytics">
                <div className="content">
                    <TabPanel
                        tabs={this.state.tabs}
                        activeTab={this.state.activeTab}
                        onTabChanged={tab => {
                            this.props.history.replace(`/analytics/${tab.toLowerCase()}`);
                        }}
                    >
                        <div data-label="Tangle" className="fill">
                            {this.state.gossipMetrics && (
                                <div className="card blocks-graph-panel margin-t-s fill">
                                    <div className="row wrap gossip">
                                        <div className="gossip-item">
                                            <h4>Known Blocks</h4>
                                            <div className="gossip-value">
                                                {this.state.gossipMetrics?.knownBlocks ?? "-"}
                                            </div>
                                        </div>
                                        <div className="gossip-item">
                                            <h4>New Blocks</h4>
                                            <div className="gossip-value">
                                                {this.state.gossipMetrics?.newBlocks ?? "-"}
                                            </div>
                                        </div>
                                        <div className="gossip-item">
                                            <h4>Received Blocks</h4>
                                            <div className="gossip-value">
                                                {this.state.gossipMetrics?.receivedBlocks ?? "-"}
                                            </div>
                                        </div>
                                        <div className="gossip-item">
                                            <h4>Sent Blocks</h4>
                                            <div className="gossip-value">
                                                {this.state.gossipMetrics?.sentBlocks ?? "-"}
                                            </div>
                                        </div>
                                        <div className="gossip-item">
                                            <h4>Received Block Requests</h4>
                                            <div className="gossip-value">
                                                {this.state.gossipMetrics?.receivedBlockRequests ?? "-"}
                                            </div>
                                        </div>
                                        <div className="gossip-item">
                                            <h4>Sent Block Requests</h4>
                                            <div className="gossip-value">
                                                {this.state.gossipMetrics?.sentBlockRequests ?? "-"}
                                            </div>
                                        </div>


                                        <div className="gossip-item">
                                            <h4>Received Heartbeats</h4>
                                            <div className="gossip-value">
                                                {this.state.gossipMetrics?.receivedHeartbeats ?? "-"}
                                            </div>
                                        </div>
                                        <div className="gossip-item">
                                            <h4>Sent Heartbeats</h4>
                                            <div className="gossip-value">
                                                {this.state.gossipMetrics?.sentHeartbeats ?? "-"}
                                            </div>
                                        </div>
                                        <div className="gossip-item">
                                            <h4>Received Milestone Requests</h4>
                                            <div className="gossip-value">
                                                {this.state.gossipMetrics?.receivedMilestoneRequests ?? "-"}
                                            </div>
                                        </div>
                                        <div className="gossip-item">
                                            <h4>Sent Milestone Requests</h4>
                                            <div className="gossip-value">
                                                {this.state.gossipMetrics?.sentMilestoneRequests ?? "-"}
                                            </div>
                                        </div>
                                        <div className="gossip-item">
                                            <h4>Dropped Packets</h4>
                                            <div className="gossip-value">
                                                {this.state.gossipMetrics?.droppedPackets ?? "-"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="card fill margin-t-s">
                                <Graph
                                    caption="Blocks Per Second"
                                    seriesMaxLength={30}
                                    timeInterval={1000}
                                    endTime={this.state.lastReceivedBpsTime}
                                    series={[
                                        {
                                            className: "bar-color-1",
                                            label: "Incoming",
                                            values: this.state.bpsIncoming
                                        },
                                        {
                                            className: "bar-color-2",
                                            label: "Outgoing",
                                            values: this.state.bpsOutgoing
                                        }
                                    ]}
                                />
                            </div>
                            <div className="card fill margin-t-s">
                                <Graph
                                    caption="Blocks Per Milestone"
                                    seriesMaxLength={30}
                                    timeInterval={this.state.averageMilestoneTime}
                                    endTime={this.state.lastMsReceivedTime}
                                    series={[
                                        {
                                            className: "bar-color-1",
                                            label: "Blocks",
                                            values: this.state.bps
                                        },
                                        {
                                            className: "bar-color-2",
                                            label: "Referenced Blocks",
                                            values: this.state.rbps
                                        }
                                    ]}
                                />
                            </div>
                            <div className="card fill margin-t-s">
                                <Graph
                                    caption="Time Between Milestones"
                                    seriesMaxLength={60}
                                    timeInterval={this.state.averageMilestoneTime}
                                    endTime={this.state.lastMsReceivedTime}
                                    series={[
                                        {
                                            className: "bar-color-1",
                                            label: "Incoming",
                                            values: this.state.milestoneTiming
                                        }
                                    ]}
                                />
                            </div>
                        </div>

                        <div data-label="Node" className="fill">
                            <div className="card fill">
                                <Graph
                                    caption="Database (MB)"
                                    seriesMaxLength={60}
                                    endTime={this.state.lastStatusReceivedTime}
                                    timeInterval={this.state.lastStatusInterval}
                                    series={[
                                        {
                                            className: "bar-color-1",
                                            label: "Size",
                                            values: this.state.databaseSize
                                        }
                                    ]}
                                />
                            </div>
                            <div className="card fill margin-t-s">
                                <Graph
                                    caption="Memory (MiB)"
                                    seriesMaxLength={60}
                                    endTime={this.state.lastDbReceivedTime}
                                    timeInterval={this.state.lastDbInterval}
                                    series={[
                                        {
                                            className: "bar-color-1",
                                            label: "Memory",
                                            values: this.state.memorySize
                                        }
                                    ]}
                                />
                            </div>
                            <div className="card fill margin-t-s">
                                <Graph
                                    caption="Request Queue"
                                    seriesMaxLength={30}
                                    endTime={this.state.lastStatusReceivedTime}
                                    timeInterval={this.state.lastStatusInterval}
                                    series={[
                                        {
                                            className: "bar-color-1",
                                            label: "Queued",
                                            values: this.state.requestQueue.queued
                                        },
                                        {
                                            className: "bar-color-2",
                                            label: "Pending",
                                            values: this.state.requestQueue.pending
                                        },
                                        {
                                            className: "bar-color-3",
                                            label: "Processing",
                                            values: this.state.requestQueue.processing
                                        },
                                        {
                                            className: "bar-color-4",
                                            label: "Latency",
                                            values: this.state.requestQueue.averageLatency
                                        }
                                    ]}
                                />
                            </div>
                        </div>

                        <div data-label="Memory" className="fill">
                            <div className="card fill">
                                <Graph
                                    caption="Stack Alloc (MiB)"
                                    seriesMaxLength={60}
                                    endTime={this.state.lastStatusReceivedTime}
                                    timeInterval={this.state.lastStatusInterval}
                                    series={[
                                        {
                                            className: "bar-color-1",
                                            label: "Stack Alloc",
                                            values: this.state.memory.stackAlloc
                                        }
                                    ]}
                                />
                            </div>
                            <div className="card fill margin-t-s">
                                <Graph
                                    caption="Heap In Use (MiB)"
                                    seriesMaxLength={60}
                                    endTime={this.state.lastStatusReceivedTime}
                                    timeInterval={this.state.lastStatusInterval}
                                    series={[
                                        {
                                            className: "bar-color-2",
                                            label: "Heap In Use",
                                            values: this.state.memory.heapInUse
                                        }
                                    ]}
                                />
                            </div>
                            <div className="card fill margin-t-s">
                                <Graph
                                    caption="Heap Released (MiB)"
                                    seriesMaxLength={60}
                                    endTime={this.state.lastStatusReceivedTime}
                                    timeInterval={this.state.lastStatusInterval}
                                    series={[
                                        {
                                            className: "bar-color-3",
                                            label: "Heap Released",
                                            values: this.state.memory.heapReleased
                                        }
                                    ]}
                                />
                            </div>
                            <div className="card fill margin-t-s">
                                <Graph
                                    caption="Heap Idle (MiB)"
                                    seriesMaxLength={60}
                                    endTime={this.state.lastStatusReceivedTime}
                                    timeInterval={this.state.lastStatusInterval}
                                    series={[
                                        {
                                            className: "bar-color-4",
                                            label: "Heap Idle",
                                            values: this.state.memory.heapIdle
                                        }
                                    ]}
                                />
                            </div>
                            <div className="card fill margin-t-s">
                                <Graph
                                    caption="Heap Sys (MiB)"
                                    seriesMaxLength={60}
                                    endTime={this.state.lastStatusReceivedTime}
                                    timeInterval={this.state.lastStatusInterval}
                                    series={[
                                        {
                                            className: "bar-color-1",
                                            label: "Heap Sys",
                                            values: this.state.memory.heapSys
                                        }
                                    ]}
                                />
                            </div>
                            <div className="card fill margin-t-s">
                                <Graph
                                    caption="Total Alloc (MiB)"
                                    seriesMaxLength={60}
                                    endTime={this.state.lastStatusReceivedTime}
                                    timeInterval={this.state.lastStatusInterval}
                                    series={[
                                        {
                                            className: "bar-color-2",
                                            label: "Total Alloc",
                                            values: this.state.memory.totalAlloc
                                        }
                                    ]}
                                />
                            </div>
                        </div>

                        <div data-label="Caches" className="fill">
                            <div className="card fill">
                                <Graph
                                    caption="Request Queue"
                                    seriesMaxLength={60}
                                    endTime={this.state.lastStatusReceivedTime}
                                    timeInterval={this.state.lastStatusInterval}
                                    series={[
                                        {
                                            className: "bar-color-1",
                                            label: "Request Queue",
                                            values: this.state.caches.requestQueue
                                        }
                                    ]}
                                />
                            </div>
                            <div className="card fill margin-t-s">
                                <Graph
                                    caption="Children"
                                    seriesMaxLength={60}
                                    endTime={this.state.lastStatusReceivedTime}
                                    timeInterval={this.state.lastStatusInterval}
                                    series={[
                                        {
                                            className: "bar-color-2",
                                            label: "Children",
                                            values: this.state.caches.children
                                        }
                                    ]}
                                />
                            </div>
                            <div className="card fill margin-t-s">
                                <Graph
                                    caption="Milestones"
                                    seriesMaxLength={60}
                                    endTime={this.state.lastStatusReceivedTime}
                                    timeInterval={this.state.lastStatusInterval}
                                    series={[
                                        {
                                            className: "bar-color-3",
                                            label: "Milestones",
                                            values: this.state.caches.milestones
                                        }
                                    ]}
                                />
                            </div>
                            <div className="card fill margin-t-s">
                                <Graph
                                    caption="Blocks"
                                    seriesMaxLength={60}
                                    endTime={this.state.lastStatusReceivedTime}
                                    timeInterval={this.state.lastStatusInterval}
                                    series={[
                                        {
                                            className: "bar-color-4",
                                            label: "Blocks",
                                            values: this.state.caches.blocks
                                        }
                                    ]}
                                />
                            </div>
                            <div className="card fill margin-t-s">
                                <Graph
                                    caption="Incoming Block Work Units"
                                    seriesMaxLength={60}
                                    endTime={this.state.lastStatusReceivedTime}
                                    timeInterval={this.state.lastStatusInterval}
                                    series={[
                                        {
                                            className: "bar-color-1",
                                            label: "Incoming Block Work Units",
                                            values: this.state.caches.IncomingBlocksWorkUnits
                                        }
                                    ]}
                                />
                            </div>
                        </div>

                        {this.state.isSpammerAvailable && (
                            <div data-label="Spammer" className="fill">
                                <div className="card fill">
                                    <Graph
                                        caption="Tip Selection Duration Micro-Seconds"
                                        seriesMaxLength={60}
                                        timeInterval={this.state.lastSpamInterval}
                                        endTime={this.state.lastSpamReceivedTime}
                                        series={[
                                            {
                                                className: "bar-color-1",
                                                label: "Tip Time",
                                                values: this.state.tipSelection
                                            }
                                        ]}
                                    />
                                </div>

                                <div className="card fill margin-t-s">
                                    <Graph
                                        caption="PoW Duration Seconds"
                                        seriesMaxLength={60}
                                        timeInterval={this.state.lastSpamInterval}
                                        endTime={this.state.lastSpamReceivedTime}
                                        series={[
                                            {
                                                className: "bar-color-2",
                                                label: "PoW Time",
                                                values: this.state.pow
                                            }
                                        ]}
                                    />
                                </div>

                                <div className="card fill margin-t-s">
                                    <Graph
                                        caption="Spam Blocks"
                                        seriesMaxLength={30}
                                        endTime={this.state.lastSpamAvgReceivedTime}
                                        timeInterval={1000}
                                        series={[
                                            {
                                                className: "bar-color-1",
                                                label: "New Blocks",
                                                values: this.state.spamNewBlocks
                                            },
                                            {
                                                className: "bar-color-2",
                                                label: "Average Blocks",
                                                values: this.state.spamAvgBlocks
                                            }
                                        ]}
                                    />
                                </div>
                            </div>
                        )}

                        {this._authService.isLoggedIn() && (
                            <div className="fill">
                                <p>What should we show for the log?</p>
                            </div>
                        )}
                    </TabPanel>
                </div>
            </div>
        );
    }

    /**
     * Calculate the tabs to show.
     * @param isSpammerAvailable Is the spammer available.
     * @returns The tabs.
     */
    private calculateTabs(isSpammerAvailable: boolean): string[] {
        const tabs = [
            "Tangle",
            "Node",
            "Memory",
            "Caches"
        ];

        if (isSpammerAvailable) {
            tabs.push("Spammer");
        }

        return tabs;
    }
}

export default withRouter(Analytics);
