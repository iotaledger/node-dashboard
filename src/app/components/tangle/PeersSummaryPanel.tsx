import React, { Component, ReactNode } from "react";
import { ReactComponent as HealthBadIcon } from "../../../assets/health-bad.svg";
import { ReactComponent as HealthGoodIcon } from "../../../assets/health-good.svg";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { IPeerMetric } from "../../../models/websocket/IPeerMetric";
import { WebSocketTopic } from "../../../models/websocket/webSocketTopic";
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
        };
    }

    /**
     * The component mounted.
     */
    public componentDidMount(): void {
        this._peerSubscription = this._metricsService.subscribe<IPeerMetric[]>(
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
                <h4 className="margin-b-m">Peers</h4>
                {!this.state.peers && (
                    <p>There are no peers.</p>
                )}
                {this.state.peers?.map((p, idx) => (
                    <div key={idx} className="peers-summary--item">
                        {p.connected ? <HealthGoodIcon /> : <HealthBadIcon />}
                        <span className="peer-id">
                            {p.name}
                            {p.address && (
                                <React.Fragment>
                                    <br />
                                    {p.address}
                                </React.Fragment>
                            )}
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    /**
     * Handle the peer data.
     * @param data The data to handle.
     */
    private handleData(data: IPeerMetric[]): void {
        this.setState({
            peers: data
                ? DataHelper.sortPeers(data.map(p => ({
                    connected: p.connected,
                    name: DataHelper.formatPeerName(p),
                    address: DataHelper.formatPeerAddress(p)
                })))
                : undefined
        });
    }
}

export default PeersSummaryPanel;
