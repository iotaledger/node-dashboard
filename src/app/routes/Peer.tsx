import React, { ReactNode } from "react";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";
import { ReactComponent as ChevronLeftIcon } from "../../assets/chevron-left.svg";
import { ReactComponent as EyeClosedIcon } from "../../assets/eye-closed.svg";
import { ReactComponent as EyeIcon } from "../../assets/eye.svg";
import { ServiceFactory } from "../../factories/serviceFactory";
import { IPeersResponse } from "../../models/peers/IPeersResponse";
import { WebSocketTopic } from "../../models/websocket/webSocketTopic";
import { MetricsService } from "../../services/metricsService";
import { SettingsService } from "../../services/settingsService";
import { ClipboardHelper } from "../../utils/clipboardHelper";
import { DataHelper } from "../../utils/dataHelper";
import AsyncComponent from "../components/layout/AsyncComponent";
import BlockButton from "../components/layout/BlockButton";
import Graph from "../components/layout/Graph";
import HealthIndicator from "../components/layout/HealthIndicator";
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
     * The peer metrics subscription id.
     */
    private _peerMetricsSubscription?: string;

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
            receivedPacketsDiff: [],
            sentPacketsDiff: [],
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

        this._peerMetricsSubscription = this._metricsService.subscribe<IPeersResponse>(
            WebSocketTopic.PeerMetrics,
            undefined,
            allData => {
                let alias;
                let address: string = "";
                let isConnected = false;
                const receivedPacketsTotal = [];
                const sentPacketsTotal = [];
                const receivedPacketsDiff = [];
                const sentPacketsDiff = [];
                let gossipMetrics;
                let relation = "-";

                for (const allDataPeers of allData) {
                    if (allDataPeers?.peers) {
                        const peer = allDataPeers.peers.find(p => p.id === this.props.match.params.id);

                        if (peer && peer.id === this.props.match.params.id) {
                            alias = peer.alias;
                            address = DataHelper.formatPeerAddress(peer) ?? "";
                            isConnected = peer.connected;
                            gossipMetrics = peer.gossipMetrics;
                            relation = peer.relation;

                            receivedPacketsTotal.push(gossipMetrics.packetsReceived);
                            sentPacketsTotal.push(gossipMetrics.packetsSent);
                        }
                    }
                }

                for (let i = 1; i < receivedPacketsTotal.length; i++) {
                    receivedPacketsDiff.push(
                        Math.max(
                            receivedPacketsTotal[i] - receivedPacketsTotal[i - 1]
                            , 0)
                    );
                }
                for (let i = 1; i < sentPacketsTotal.length; i++) {
                    sentPacketsDiff.push(
                        Math.max(
                            sentPacketsTotal[i] - sentPacketsTotal[i - 1]
                            , 0)
                    );
                }

                this.setState({
                    alias,
                    address,
                    isConnected,
                    receivedPacketsDiff,
                    sentPacketsDiff,
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

        if (this._peerMetricsSubscription) {
            this._metricsService.unsubscribe(this._peerMetricsSubscription);
            this._peerMetricsSubscription = undefined;
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
                                        <span className="row bottom">
                                            <p className="secondary margin-t-t">{this.state.blindMode
                                                ? "*".repeat(this.props.match.params.id.length)
                                                : this.props.match.params.id}
                                            </p>
                                            <div className="margin-l-t">
                                                <BlockButton
                                                    onClick={() => ClipboardHelper.copy(this.props.match.params.id)}
                                                    buttonType="copy"
                                                    labelPosition="right"
                                                />
                                            </div>
                                        </span>
                                    </React.Fragment>
                                )}
                                {!this.state.alias && (
                                    <span className="row bottom">
                                        <h2 className="word-break-all">{
                                            this.state.blindMode ?
                                                "*".repeat(this.props.match.params.id.length) :
                                                this.props.match.params.id
                                            }
                                        </h2>
                                        <div className="margin-l-t">
                                            <BlockButton
                                                onClick={() => ClipboardHelper.copy(this.props.match.params.id)}
                                                buttonType="copy"
                                                labelPosition="right"
                                            />
                                        </div>
                                    </span>
                                )}
                                <span className="row bottom">
                                    <p className="secondary margin-t-t">{this.state.blindMode
                                        ? "*".repeat(this.state.address.length) : this.state.address}
                                    </p>
                                    {this.state.address.length > 0 && (
                                        <div className="margin-l-t">
                                            <BlockButton
                                                onClick={() => {
                                                    const parts = this.state.address.split(":");
                                                    if (parts.length === 2) {
                                                        ClipboardHelper.copy(`/ip4/${parts[0]}/tcp/${parts[1]}`);
                                                    } else {
                                                        ClipboardHelper.copy(this.state.address);
                                                    }
                                                }}
                                                buttonType="copy"
                                                labelPosition="right"
                                            />
                                        </div>
                                    )}
                                </span>
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
                            </div>
                        </div>
                    </div>

                    <div className="card blocks-graph-panel margin-t-s">
                        <Graph
                            caption="Packets per Second"
                            endTime={this.state.lastUpdateTime}
                            timeInterval={1000}
                            seriesMaxLength={30}
                            series={[
                                {
                                    className: "bar-color-1",
                                    label: "Incoming",
                                    values: this.state.receivedPacketsDiff
                                },
                                {
                                    className: "bar-color-2",
                                    label: "Outgoing",
                                    values: this.state.sentPacketsDiff
                                }
                            ]}
                        />
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
