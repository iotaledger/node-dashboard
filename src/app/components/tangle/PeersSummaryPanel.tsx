import { IPeer } from "@iota/iota.js";
import React, { Component, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ReactComponent as EyeClosedIcon } from "../../../assets/eye-closed.svg";
import { ReactComponent as EyeIcon } from "../../../assets/eye.svg";
import { ReactComponent as HealthBadIcon } from "../../../assets/health-bad.svg";
import { ReactComponent as HealthGoodIcon } from "../../../assets/health-good.svg";
import { ReactComponent as HealthWarningIcon } from "../../../assets/health-warning.svg";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { WebSocketTopic } from "../../../models/websocket/webSocketTopic";
import { EventAggregator } from "../../../services/eventAggregator";
import { MetricsService } from "../../../services/metricsService";
import { DataHelper } from "../../../utils/dataHelper";
import "./PeersSummaryPanel.scss";
import { PeersSummaryState } from "./PeersSummaryState";

/**
 * Display a list of the peers.
 */
class PeersSummaryPanel extends Component<unknown, PeersSummaryState> {
    /**
     * The metrics service.
     */
    private readonly _metricsService: MetricsService;

    /**
     * The peer subscription id.
     */
    private _peerSubscription?: string;

    /**
     * Create a new instance of PeersSummaryPanel.
     * @param props The props.
     */
    constructor(props: unknown) {
        super(props);

        this._metricsService = ServiceFactory.get<MetricsService>("metrics");

        this.state = {
            obfuscateDetails: false
        };
    }

    /**
     * The component mounted.
     */
    public componentDidMount(): void {
        this._peerSubscription = this._metricsService.subscribe<IPeer[]>(
            WebSocketTopic.PeerMetric,
            data => {
                this.handleData(data);
            });
    }

    /**
     * The component will unmount.
     */
    public componentWillUnmount(): void {
        if (this._peerSubscription) {
            this._metricsService.unsubscribe(this._peerSubscription);
            this._peerSubscription = undefined;
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="peers-summary">
                <div className="row middle spread margin-b-m">
                    <h4>Peers</h4>
                    <button
                        type="button"
                        onClick={() => this.toggleObfuscateDetails()}
                        className="peers-summary--icon-button"
                    >
                        {this.state.obfuscateDetails ? <EyeIcon /> : <EyeClosedIcon />}
                    </button>
                </div>
                {!this.state.peers && (
                    <p>There are no peers.</p>
                )}
                {this.state.peers?.map((p, idx) => (
                    <Link
                        to={`/peers/${p.id}`}
                        key={idx}
                        className="peers-summary--item"
                    >
                        <div className="peer-health-icon">
                            {p.health === 0 && <HealthBadIcon />}
                            {p.health === 1 && <HealthWarningIcon />}
                            {p.health === 2 && <HealthGoodIcon />}
                        </div>
                        <div className="col">
                            <div className="peer-id">
                                {this.state.obfuscateDetails && ("*".repeat((p.alias ?? p.id).length))}
                                {!this.state.obfuscateDetails && (p.alias ?? p.id)}
                            </div>
                            {p.address && (
                                <div className="peer-id">
                                    {this.state.obfuscateDetails ? "*".repeat(p.address.length) : p.address}
                                </div>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        );
    }

    /**
     * Handle the peer data.
     * @param data The data to handle.
     */
    private handleData(data: IPeer[]): void {
        let sortedPeers;

        if (data) {
            sortedPeers = DataHelper.sortPeers(data.map(p => ({
                id: p.id,
                alias: p.alias,
                health: DataHelper.calculateHealth(p),
                address: DataHelper.formatPeerAddress(p)
            })));
        }

        this.setState({
            peers: sortedPeers
        });
    }

    private toggleObfuscateDetails(): void {
        EventAggregator.publish("obfuscate-details", !this.state.obfuscateDetails);
        this.setState({ obfuscateDetails: !this.state.obfuscateDetails });
    }
}

export default PeersSummaryPanel;
