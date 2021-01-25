import { IPeer } from "@iota/iota.js";
import React, { ReactNode } from "react";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";
import { ReactComponent as ChevronLeftIcon } from "../../assets/chevron-left.svg";
import { ReactComponent as ConfirmationIcon } from "../../assets/confirmation.svg";
import { ReactComponent as MilestoneIcon } from "../../assets/milestone.svg";
import { ReactComponent as PruningIcon } from "../../assets/pruning.svg";
import { ServiceFactory } from "../../factories/serviceFactory";
import { WebSocketTopic } from "../../models/websocket/webSocketTopic";
import { MetricsService } from "../../services/metricsService";
import { DataHelper } from "../../utils/dataHelper";
import AsyncComponent from "../components/layout/AsyncComponent";
import Graph from "../components/layout/Graph";
import HealthIndicator from "../components/layout/HealthIndicator";
import InfoPanel from "../components/layout/InfoPanel";
import "./Peer.scss";
import { PeerRouteProps } from "./PeerRouteProps";
import { PeerState } from "./PeerState";

/**
 * Peer panel.
 */
class Peer extends AsyncComponent<RouteComponentProps<PeerRouteProps>, PeerState> {
    /**
     * The metrics service.
     */
    private readonly _metricsService: MetricsService;

    /**
     * The peers subscription id.
     */
    private _peersSubscription?: string;

    /**
     * Create a new instance of Peers.
     * @param props The props.
     */
    constructor(props: RouteComponentProps<PeerRouteProps>) {
        super(props);

        this._metricsService = ServiceFactory.get<MetricsService>("metrics");

        this.state = {
            name: "",
            address: "",
            isConnected: false,
            isSynced: false,
            hasNeighbors: false,
            latestMilestoneIndex: "-",
            latestSolidMilestoneIndex: "-",
            pruningIndex: "-",
            syncedNeighbors: "-",
            connectedNeighbors: "-",
            newMessagesDiff: [],
            sentMessagesDiff: []
        };
    }

    /**
     * The component mounted.
     */
    public componentDidMount(): void {
        super.componentDidMount();

        this._peersSubscription = this._metricsService.subscribe<IPeer[]>(
            WebSocketTopic.PeerMetric,
            undefined,
            allData => {
                let name = this.props.match.params.id;
                let address: string = "";
                let isConnected = false;
                let isSynced = false;
                let hasNeighbors = false;
                let latestMilestoneIndex = "-";
                let latestSolidMilestoneIndex = "-";
                let pruningIndex = "-";
                let syncedNeighbors = "-";
                let connectedNeighbors = "-";
                const newMessagesTotal = [];
                const sentMessagesTotal = [];
                const newMessagesDiff = [];
                const sentMessagesDiff = [];
                let gossipMetrics;

                for (const allDataPeers of allData) {
                    if (allDataPeers) {
                        const peer = allDataPeers.find(p => p.id === this.props.match.params.id);

                        if (peer) {
                            name = DataHelper.formatPeerName(peer);
                            address = DataHelper.formatPeerAddress(peer) ?? "";
                            isConnected = peer.connected;
                            isSynced = isConnected && DataHelper.calculateIsSynced(peer);
                            gossipMetrics = peer.gossip?.metrics;

                            if (peer.gossip?.heartbeat) {
                                newMessagesTotal.push(peer.gossip.metrics.newMessages);
                                sentMessagesTotal.push(peer.gossip.metrics.sentMessages);

                                if (isConnected) {
                                    hasNeighbors = peer.gossip.heartbeat.connectedNeighbors > 0;
                                    latestMilestoneIndex = peer.gossip.heartbeat.latestMilestoneIndex.toString();
                                    latestSolidMilestoneIndex = peer.gossip.heartbeat.solidMilestoneIndex.toString();
                                    pruningIndex = peer.gossip.heartbeat.prunedMilestoneIndex.toString();
                                    syncedNeighbors = peer.gossip.heartbeat.syncedNeighbors.toString();
                                    connectedNeighbors = peer.gossip.heartbeat.connectedNeighbors.toString();
                                }
                            }
                        }
                    }
                }

                for (let i = 1; i < newMessagesTotal.length; i++) {
                    newMessagesDiff.push(
                        Math.max(
                            newMessagesTotal[i] - newMessagesTotal[i - 1]
                            , 0)
                    );
                }
                for (let i = 1; i < sentMessagesTotal.length; i++) {
                    sentMessagesDiff.push(
                        Math.max(
                            sentMessagesTotal[i] - sentMessagesTotal[i - 1])
                        , 0);
                }

                this.setState({
                    name,
                    address,
                    isConnected,
                    isSynced,
                    hasNeighbors,
                    latestMilestoneIndex,
                    latestSolidMilestoneIndex,
                    pruningIndex,
                    syncedNeighbors,
                    connectedNeighbors,
                    newMessagesDiff,
                    sentMessagesDiff,
                    gossipMetrics
                });
            }
        );
    }

    /**
     * The component will unmount.
     */
    public componentWillUnmount(): void {
        super.componentWillUnmount();

        if (this._peersSubscription) {
            this._metricsService.unsubscribe(this._peersSubscription);
            this._peersSubscription = undefined;
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="peer">
                <div className="content">
                    <Link
                        to="/peers"
                        className="row inline middle margin-b-s"
                    >
                        <ChevronLeftIcon className="secondary" />
                        <h3 className="secondary margin-l-s">Back to Peers</h3>
                    </Link>

                    <div className="card">
                        <div className="banner row spread">
                            <div className="node-info">
                                <h2>{this.state.name}</h2>
                                <p className="secondary margin-t-t">{this.state.address}</p>
                            </div>
                            <div className="health-indicators">
                                <HealthIndicator
                                    label="Connected"
                                    healthy={this.state.isConnected}
                                    className="child"
                                />
                                <HealthIndicator
                                    label="Synced"
                                    healthy={this.state.isSynced}
                                    className="child"
                                />
                                <HealthIndicator
                                    label="Neighbors"
                                    healthy={this.state.hasNeighbors}
                                    className="child"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="row info margin-t-s">
                        <InfoPanel
                            caption="LSMI / LMI"
                            value={`${this.state.latestSolidMilestoneIndex} / ${this.state.latestMilestoneIndex}`}
                            icon={<MilestoneIcon />}
                            backgroundStyle="green"
                            className="margin-r-s"
                        />
                        <InfoPanel
                            caption="Pruning Index"
                            value={this.state.pruningIndex}
                            icon={<PruningIcon />}
                            backgroundStyle="orange"
                            className="margin-r-s"
                        />
                        <InfoPanel
                            caption="Synced Neighbors"
                            value={`${this.state.syncedNeighbors} / ${this.state.connectedNeighbors}`}
                            icon={<ConfirmationIcon />}
                            backgroundStyle="purple"
                        />
                    </div>

                    <div className="card messages-graph-panel margin-t-s">
                        <Graph
                            caption="Messages per Second"
                            seriesMaxLength={60}
                            series={[
                                {
                                    className: "bar-color-1",
                                    label: "Incoming",
                                    values: this.state.newMessagesDiff
                                },
                                {
                                    className: "bar-color-2",
                                    label: "Outgoing",
                                    values: this.state.sentMessagesDiff
                                }
                            ]}
                        />

                        <div className="row spread padding-s gossip">
                            <div className="col">
                                <h4>Total Messages</h4>
                                <div className="gossip-value">{this.state.gossipMetrics?.knownMessages ?? "-"}</div>
                                <h4 className="margin-t-s">Sent Heartbeats</h4>
                                <div className="gossip-value">{this.state.gossipMetrics?.sentHeartbeats ?? "-"}</div>
                            </div>
                            <div className="col">
                                <h4>New Messages</h4>
                                <div className="gossip-value">{this.state.gossipMetrics?.newMessages ?? "-"}</div>
                                <h4 className="margin-t-s">Received Heartbeats</h4>
                                <div className="gossip-value">
                                    {this.state.gossipMetrics?.receivedHeartbeats ?? "-"}
                                </div>
                            </div>
                            <div className="col">
                                <h4>Received Messages</h4>
                                <div className="gossip-value">{this.state.gossipMetrics?.receivedMessages ?? "-"}</div>
                                <h4 className="margin-t-s">Sent Milestone Requests</h4>
                                <div className="gossip-value">
                                    {this.state.gossipMetrics?.sentMilestoneRequests ?? "-"}
                                </div>
                            </div>
                            <div className="col">
                                <h4>Sent Messages</h4>
                                <div className="gossip-value">{this.state.gossipMetrics?.sentMessages ?? "-"}</div>
                                <h4 className="margin-t-s">Received Milestone Requests</h4>
                                <div className="gossip-value">
                                    {this.state.gossipMetrics?.receivedMilestoneRequests ?? "-"}
                                </div>
                            </div>
                            <div className="col">
                                <h4>Received Message Requests</h4>
                                <div className="gossip-value">
                                    {this.state.gossipMetrics?.receivedMessageRequests ?? "-"}
                                </div>
                                <h4 className="margin-t-s">Dropped Packets</h4>
                                <div className="gossip-value">{this.state.gossipMetrics?.droppedPackets ?? "-"}</div>
                            </div>
                            <div className="col">
                                <h4>Sent Message Requests</h4>
                                <div className="gossip-value">
                                    {this.state.gossipMetrics?.sentMessageRequests ?? "-"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(Peer);
