import { IPeer } from "@iota/iota.js";
import React, { ReactNode } from "react";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";
import { ReactComponent as ChevronLeftIcon } from "../../assets/chevron-left.svg";
import { ReactComponent as ConfirmationIcon } from "../../assets/confirmation.svg";
import { ReactComponent as EyeClosedIcon } from "../../assets/eye-closed.svg";
import { ReactComponent as EyeIcon } from "../../assets/eye.svg";
import { ReactComponent as MilestoneIcon } from "../../assets/milestone.svg";
import { ReactComponent as PruningIcon } from "../../assets/pruning.svg";
import { ServiceFactory } from "../../factories/serviceFactory";
import { WebSocketTopic } from "../../models/websocket/webSocketTopic";
import { MetricsService } from "../../services/metricsService";
import { SettingsService } from "../../services/settingsService";
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
     * The settings service.
     */
    private readonly _settingsService: SettingsService;

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
        this._settingsService = ServiceFactory.get<SettingsService>("settings");

        this.state = {
            address: "",
            isConnected: false,
            isSynced: false,
            hasPeers: false,
            latestMilestoneIndex: "-",
            latestSolidMilestoneIndex: "-",
            pruningIndex: "-",
            syncedPeers: "-",
            connectedPeers: "-",
            newMessagesDiff: [],
            sentMessagesDiff: [],
            relation: "-",
            lastUpdateTime: 0,
            blindMode: this._settingsService.getBlindMode()
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
                let alias;
                let address: string = "";
                let isConnected = false;
                let isSynced = false;
                let hasPeers = false;
                let latestMilestoneIndex = "-";
                let latestSolidMilestoneIndex = "-";
                let pruningIndex = "-";
                let syncedPeers = "-";
                let connectedPeers = "-";
                const newMessagesTotal = [];
                const sentMessagesTotal = [];
                const newMessagesDiff = [];
                const sentMessagesDiff = [];
                let gossipMetrics;
                let relation = "-";

                for (const allDataPeers of allData) {
                    if (allDataPeers) {
                        const peer = allDataPeers.find(p => p.id === this.props.match.params.id);

                        if (peer) {
                            alias = peer.alias;
                            address = DataHelper.formatPeerAddress(peer) ?? "";
                            isConnected = peer.connected;
                            isSynced = isConnected && DataHelper.calculateIsSynced(peer);
                            gossipMetrics = peer.gossip?.metrics;
                            relation = peer.relation;

                            if (peer.gossip?.heartbeat) {
                                newMessagesTotal.push(peer.gossip.metrics.newMessages);
                                sentMessagesTotal.push(peer.gossip.metrics.sentMessages);

                                if (isConnected) {
                                    hasPeers = peer.gossip.heartbeat.connectedNeighbors > 0;
                                    latestMilestoneIndex = peer.gossip.heartbeat.latestMilestoneIndex.toString();
                                    latestSolidMilestoneIndex = peer.gossip.heartbeat.solidMilestoneIndex.toString();
                                    pruningIndex = peer.gossip.heartbeat.prunedMilestoneIndex.toString();
                                    syncedPeers = peer.gossip.heartbeat.syncedNeighbors.toString();
                                    connectedPeers = peer.gossip.heartbeat.connectedNeighbors.toString();
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
                            sentMessagesTotal[i] - sentMessagesTotal[i - 1]
                            , 0)
                    );
                }

                this.setState({
                    alias,
                    address,
                    isConnected,
                    isSynced,
                    hasPeers,
                    latestMilestoneIndex,
                    latestSolidMilestoneIndex,
                    pruningIndex,
                    syncedPeers,
                    connectedPeers,
                    newMessagesDiff,
                    sentMessagesDiff,
                    gossipMetrics,
                    relation,
                    lastUpdateTime: Date.now()
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
                    <div className="row middle spread margin-b-s">
                        <Link
                            to="/peers"
                            className="row inline middle"
                        >
                            <ChevronLeftIcon className="secondary" />
                            <h3 className="secondary margin-l-s">Back to Peers</h3>
                        </Link>
                        <button
                            type="button"
                            onClick={() => this.toggleBlindMode()}
                            className="peer--icon-button"
                        >
                            {this.state.blindMode ? <EyeIcon /> : <EyeClosedIcon />}
                        </button>
                    </div>

                    <div className="card">
                        <div className="banner row tablet-down-column spread">
                            <div className="node-info">
                                {this.state.alias && (
                                    <React.Fragment>
                                        <h2 className="word-break-all">{this.state.blindMode
                                            ? "*".repeat(this.state.alias.length) : this.state.alias}
                                        </h2>
                                        <p className="secondary margin-t-t">{this.state.blindMode
                                            ? "*".repeat(this.props.match.params.id.length)
                                            : this.props.match.params.id}
                                        </p>
                                    </React.Fragment>
                                )}
                                {!this.state.alias && (
                                    <h2 className="word-break-all">{this.state.blindMode
                                        ? "*".repeat(this.props.match.params.id.length) : this.props.match.params.id}
                                    </h2>
                                )}
                                <p className="secondary margin-t-t">{this.state.blindMode
                                    ? "*".repeat(this.state.address.length) : this.state.address}
                                </p>
                                <p className="secondary margin-t-t">
                                    Relation:&nbsp;
                                    {`${this.state.relation.slice(0, 1).toUpperCase()}${this.state.relation.slice(1)}`}
                                </p>
                            </div>
                            <div className="health-indicators col tablet-down-only-row phone-down-column">
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
                                    label="Peers"
                                    healthy={this.state.hasPeers}
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
                        />
                        <InfoPanel
                            caption="Pruning Index"
                            value={this.state.pruningIndex}
                            icon={<PruningIcon />}
                            backgroundStyle="orange"
                        />
                        <InfoPanel
                            caption="Synced Peers"
                            value={`${this.state.syncedPeers} / ${this.state.connectedPeers}`}
                            icon={<ConfirmationIcon />}
                            backgroundStyle="purple"
                        />
                    </div>

                    <div className="card messages-graph-panel margin-t-s">
                        <Graph
                            caption="Messages per Second"
                            endTime={this.state.lastUpdateTime}
                            timeInterval={1000}
                            seriesMaxLength={30}
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

                        <div className="row wrap padding-s gossip">
                            <div className="gossip-item">
                                <h4>Known Messages</h4>
                                <div className="gossip-value">
                                    {this.state.gossipMetrics?.knownMessages ?? "-"}
                                </div>
                            </div>
                            <div className="gossip-item">
                                <h4>New Messages</h4>
                                <div className="gossip-value">
                                    {this.state.gossipMetrics?.newMessages ?? "-"}
                                </div>
                            </div>
                            <div className="gossip-item">
                                <h4>Received Messages</h4>
                                <div className="gossip-value">
                                    {this.state.gossipMetrics?.receivedMessages ?? "-"}
                                </div>
                            </div>
                            <div className="gossip-item">
                                <h4>Sent Messages</h4>
                                <div className="gossip-value">
                                    {this.state.gossipMetrics?.sentMessages ?? "-"}
                                </div>
                            </div>
                            <div className="gossip-item">
                                <h4>Received Message Requests</h4>
                                <div className="gossip-value">
                                    {this.state.gossipMetrics?.receivedMessageRequests ?? "-"}
                                </div>
                            </div>
                            <div className="gossip-item">
                                <h4>Sent Message Requests</h4>
                                <div className="gossip-value">
                                    {this.state.gossipMetrics?.sentMessageRequests ?? "-"}
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
                </div>
            </div>
        );
    }

    /**
     * Toggle the flag for blind mode.
     */
    private toggleBlindMode(): void {
        this._settingsService.setBlindMode(!this.state.blindMode);
        this.setState({ blindMode: !this.state.blindMode });
    }
}

export default withRouter(Peer);
