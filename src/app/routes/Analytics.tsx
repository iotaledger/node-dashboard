import { IGossipMetrics } from "@iota/iota.js";
import React, { ReactNode } from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { ServiceFactory } from "../../factories/serviceFactory";
import { IAvgSpamMetrics } from "../../models/websocket/IAvgSpamMetrics";
import { IConfirmedMsMetrics } from "../../models/websocket/IConfirmedMsMetrics";
import { IDBSizeMetric } from "../../models/websocket/IDBSizeMetric";
import { IMpsMetrics } from "../../models/websocket/IMpsMetrics";
import { ISpamMetrics } from "../../models/websocket/ISpamMetrics";
import { IStatus } from "../../models/websocket/IStatus";
import { WebSocketTopic } from "../../models/websocket/webSocketTopic";
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
    private static readonly BYTES_PER_MB: number = 1024 * 1024;

    /**
     * The metrics service.
     */
    private readonly _metricsService: MetricsService;

    /**
     * The mps metrics subscription id.
     */
    private _mpsMetricsSubscription?: string;

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
     * Create a new instance of Analytics.
     * @param props The props.
     */
    constructor(props: RouteComponentProps<AnalyticsRouteProps>) {
        super(props);

        this._metricsService = ServiceFactory.get<MetricsService>("metrics");

        this.state = {
            activeTab: this.props.match.params.section ?? "tangle",
            mpsIncoming: [],
            mpsOutgoing: [],
            lastReceivedMpsTime: 0,
            averageMilestoneTime: 0,
            lastMsReceivedTime: 0,
            milestoneTiming: [],
            mps: [],
            cmps: [],
            lastStatusReceivedTime: 0,
            lastDbInterval: 1000,
            memorySize: [],
            lastStatusInterval: 1000,
            lastDbReceivedTime: 0,
            databaseSize: [],
            isSpammerAvailable: false,
            lastSpamAvgReceivedTime: 0,
            spamNewMsgs: [],
            spamAvgMsgs: [],
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
                messages: [],
                incomingMessageWorkUnits: []
            }
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        super.componentDidMount();

        this._mpsMetricsSubscription = this._metricsService.subscribe<IMpsMetrics>(
            WebSocketTopic.MPSMetrics,
            undefined,
            allData => {
                const nonNull = allData.filter(d => d !== undefined && d !== null);
                this.setState({
                    lastReceivedMpsTime: Date.now(),
                    mpsIncoming: nonNull.map(m => m.incoming),
                    mpsOutgoing: nonNull.map(m => m.outgoing)
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
                    mps: nonNull.map(m => m.mps * m.time_since_last_ms),
                    cmps: nonNull.map(m => m.cmps * m.time_since_last_ms)
                });
            }
        );

        this._statusSubscription = this._metricsService.subscribe<IStatus>(
            WebSocketTopic.Status,
            undefined,
            allData => {
                const nonNull = allData.filter(d => d !== undefined && d !== null);

                this.setState({
                    memorySize: nonNull.map(d => DataHelper.calculateMemoryUsage(d) / Analytics.BYTES_PER_MB),
                    lastStatusReceivedTime: Date.now(),
                    lastStatusInterval: this.state.lastStatusReceivedTime === 0
                        ? 1000 : Date.now() - this.state.lastStatusReceivedTime
                });

                if (nonNull.length > 0) {
                    const data = nonNull[nonNull.length - 1];
                    const gossipMetrics: IGossipMetrics = {
                        newMessages: data.server_metrics.new_msgs,
                        knownMessages: data.server_metrics.known_msgs,
                        receivedMessages: data.server_metrics.known_msgs + data.server_metrics.new_msgs,
                        receivedMessageRequests: data.server_metrics.rec_msg_req,
                        receivedMilestoneRequests: data.server_metrics.rec_ms_req,
                        receivedHeartbeats: data.server_metrics.rec_heartbeat,
                        sentMessages: data.server_metrics.sent_msgs,
                        sentMessageRequests: data.server_metrics.sent_msg_req,
                        sentMilestoneRequests: data.server_metrics.sent_ms_req,
                        sentHeartbeats: data.server_metrics.sent_heartbeat,
                        droppedPackets: data.server_metrics.dropped_sent_packets
                    };

                    this.setState({ gossipMetrics });
                }

                this.setState({
                    requestQueue: {
                        queued: nonNull.map(d => d.request_queue_queued),
                        pending: nonNull.map(d => d.request_queue_pending),
                        processing: nonNull.map(d => d.request_queue_processing),
                        averageLatency: nonNull.map(d => d.request_queue_avg_latency)
                    }
                });

                this.setState({
                    memory: {
                        stackAlloc: nonNull.map(d => d.mem.stack_sys / Analytics.BYTES_PER_MB),
                        heapReleased: nonNull.map(d => d.mem.heap_released / Analytics.BYTES_PER_MB),
                        heapInUse: nonNull.map(d => d.mem.heap_inuse / Analytics.BYTES_PER_MB),
                        heapIdle: nonNull.map(d => d.mem.heap_idle / Analytics.BYTES_PER_MB),
                        heapSys: nonNull.map(d => d.mem.heap_sys / Analytics.BYTES_PER_MB),
                        totalAlloc: nonNull.map(d => d.mem.sys / Analytics.BYTES_PER_MB)
                    }
                });

                this.setState({
                    caches: {
                        requestQueue: nonNull.map(d => d.caches.request_queue.size),
                        children: nonNull.map(d => d.caches.children.size),
                        milestones: nonNull.map(d => d.caches.milestones.size),
                        messages: nonNull.map(d => d.caches.messages.size),
                        incomingMessageWorkUnits: nonNull.map(d => d.caches.incoming_message_work_units.size)
                    }
                });
            });

        this._databaseSizeSubscription = this._metricsService.subscribe<IDBSizeMetric>(
            WebSocketTopic.DBSizeMetric,
            undefined,
            allData => {
                const nonNull = allData.filter(d => d !== undefined && d !== null);

                this.setState({
                    databaseSize: nonNull.map(d => d.total / 1024 / 1024),
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
                    spamNewMsgs: nonNull.map(d => d.newMsgs),
                    spamAvgMsgs: nonNull.map(d => d.avgMsgs),
                    lastSpamAvgReceivedTime: Date.now()
                });
            });

        const pluginDetails = await Spammer.pluginIsAvailable();
        if (pluginDetails) {
            this.setState({ isSpammerAvailable: true });
        }
    }

    /**
     * The component will unmount.
     */
    public componentWillUnmount(): void {
        super.componentWillUnmount();

        if (this._mpsMetricsSubscription) {
            this._metricsService.unsubscribe(this._mpsMetricsSubscription);
            this._mpsMetricsSubscription = undefined;
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
                        tabs={[
                            "Tangle",
                            "Node",
                            "Memory",
                            "Caches",
                            "Log"
                        ].concat(this.state.isSpammerAvailable ? ["Spammer"] : [])}
                        activeTab={this.state.activeTab}
                        onTabChanged={tab => {
                            this.props.history.replace(`/analytics/${tab.toLowerCase()}`);
                        }}
                    >
                        <div className="fill">
                            {this.state.gossipMetrics && (
                                <div className="card messages-graph-panel margin-r-s margin-t-s fill">
                                    <div className="row spread padding-s gossip">
                                        <div className="col">
                                            <h4>Known Messages</h4>
                                            <div className="gossip-value">
                                                {this.state.gossipMetrics?.knownMessages ?? "-"}
                                            </div>
                                            <h4 className="margin-t-s">Received Heartbeats</h4>
                                            <div className="gossip-value">
                                                {this.state.gossipMetrics?.receivedHeartbeats ?? "-"}
                                            </div>
                                        </div>
                                        <div className="col">
                                            <h4>New Messages</h4>
                                            <div className="gossip-value">
                                                {this.state.gossipMetrics?.newMessages ?? "-"}
                                            </div>
                                            <h4 className="margin-t-s">Sent Heartbeats</h4>
                                            <div className="gossip-value">
                                                {this.state.gossipMetrics?.sentHeartbeats ?? "-"}
                                            </div>
                                        </div>
                                        <div className="col">
                                            <h4>Received Messages</h4>
                                            <div className="gossip-value">
                                                {this.state.gossipMetrics?.receivedMessages ?? "-"}
                                            </div>
                                            <h4 className="margin-t-s">Received Milestone Requests</h4>
                                            <div className="gossip-value">
                                                {this.state.gossipMetrics?.receivedMilestoneRequests ?? "-"}
                                            </div>
                                        </div>
                                        <div className="col">
                                            <h4>Sent Messages</h4>
                                            <div className="gossip-value">
                                                {this.state.gossipMetrics?.sentMessages ?? "-"}
                                            </div>
                                            <h4 className="margin-t-s">Sent Milestone Requests</h4>
                                            <div className="gossip-value">
                                                {this.state.gossipMetrics?.sentMilestoneRequests ?? "-"}
                                            </div>
                                        </div>
                                        <div className="col">
                                            <h4>Received Message Requests</h4>
                                            <div className="gossip-value">
                                                {this.state.gossipMetrics?.receivedMessageRequests ?? "-"}
                                            </div>
                                            <h4 className="margin-t-s">Dropped Packets</h4>
                                            <div className="gossip-value">
                                                {this.state.gossipMetrics?.droppedPackets ?? "-"}
                                            </div>
                                        </div>
                                        <div className="col">
                                            <h4>Sent Message Requests</h4>
                                            <div className="gossip-value">
                                                {this.state.gossipMetrics?.sentMessageRequests ?? "-"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="card fill margin-r-s margin-t-s">
                                <Graph
                                    caption="Messages Per Second"
                                    seriesMaxLength={30}
                                    timeInterval={1000}
                                    endTime={this.state.lastReceivedMpsTime}
                                    series={[
                                        {
                                            className: "bar-color-1",
                                            label: "Incoming",
                                            values: this.state.mpsIncoming
                                        },
                                        {
                                            className: "bar-color-2",
                                            label: "Outgoing",
                                            values: this.state.mpsOutgoing
                                        }
                                    ]}
                                />
                            </div>
                            <div className="card fill margin-r-s margin-t-s">
                                <Graph
                                    caption="Messages Per Milestone"
                                    seriesMaxLength={30}
                                    timeInterval={this.state.averageMilestoneTime}
                                    endTime={this.state.lastMsReceivedTime}
                                    series={[
                                        {
                                            className: "bar-color-1",
                                            label: "Messages",
                                            values: this.state.mps
                                        },
                                        {
                                            className: "bar-color-2",
                                            label: "Confirmed Messages",
                                            values: this.state.cmps
                                        }
                                    ]}
                                />
                            </div>
                            <div className="card fill margin-r-s margin-t-s">
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

                        <div className="fill">
                            <div className="card fill margin-r-s">
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
                            <div className="card fill margin-r-s margin-t-s">
                                <Graph
                                    caption="Memory (MB)"
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
                            <div className="card fill margin-r-s margin-t-s">
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

                        <div className="fill">
                            <div className="card fill margin-r-s">
                                <Graph
                                    caption="Stack Alloc (MB)"
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
                            <div className="card fill margin-r-s margin-t-s">
                                <Graph
                                    caption="Heap In Use (MB)"
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
                            <div className="card fill margin-r-s margin-t-s">
                                <Graph
                                    caption="Heap Released (MB)"
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
                            <div className="card fill margin-r-s margin-t-s">
                                <Graph
                                    caption="Heap Idle (MB)"
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
                            <div className="card fill margin-r-s margin-t-s">
                                <Graph
                                    caption="Heap Sys (MB)"
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
                            <div className="card fill margin-r-s margin-t-s">
                                <Graph
                                    caption="Total Alloc (MB)"
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

                        <div className="fill">
                            <div className="card fill margin-r-s">
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
                            <div className="card fill margin-r-s margin-t-s">
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
                            <div className="card fill margin-r-s margin-t-s">
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
                            <div className="card fill margin-r-s margin-t-s">
                                <Graph
                                    caption="Messages"
                                    seriesMaxLength={60}
                                    endTime={this.state.lastStatusReceivedTime}
                                    timeInterval={this.state.lastStatusInterval}
                                    series={[
                                        {
                                            className: "bar-color-4",
                                            label: "Messages",
                                            values: this.state.caches.messages
                                        }
                                    ]}
                                />
                            </div>
                            <div className="card fill margin-r-s margin-t-s">
                                <Graph
                                    caption="Incoming Message Work Units"
                                    seriesMaxLength={60}
                                    endTime={this.state.lastStatusReceivedTime}
                                    timeInterval={this.state.lastStatusInterval}
                                    series={[
                                        {
                                            className: "bar-color-1",
                                            label: "Incoming Message Work Units",
                                            values: this.state.caches.incomingMessageWorkUnits
                                        }
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="fill">
                            <p>What should we show for the log?</p>
                        </div>

                        <div className="fill">
                            <div className="card fill margin-r-s">
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

                            <div className="card fill margin-r-s margin-t-s">
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

                            <div className="card fill margin-r-s margin-t-s">
                                <Graph
                                    caption="Spam Messages"
                                    seriesMaxLength={30}
                                    endTime={this.state.lastSpamAvgReceivedTime}
                                    timeInterval={1000}
                                    series={[
                                        {
                                            className: "bar-color-1",
                                            label: "New Messages",
                                            values: this.state.spamNewMsgs
                                        },
                                        {
                                            className: "bar-color-2",
                                            label: "Average Messages",
                                            values: this.state.spamAvgMsgs
                                        }
                                    ]}
                                />
                            </div>
                        </div>
                    </TabPanel>
                </div>
            </div>
        );
    }
}

export default withRouter(Analytics);
