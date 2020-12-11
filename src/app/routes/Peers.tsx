import React, { ReactNode } from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { ReactComponent as HealthBadIcon } from "../../assets/health-bad.svg";
import { ReactComponent as HealthGoodIcon } from "../../assets/health-good.svg";
import { ServiceFactory } from "../../factories/serviceFactory";
import { IPeerMetric } from "../../models/websocket/IPeerMetric";
import { WebSocketTopic } from "../../models/websocket/webSocketTopic";
import { MetricsService } from "../../services/metricsService";
import { DataHelper } from "../../utils/dataHelper";
import AsyncComponent from "../components/layout/AsyncComponent";
import Graph from "../components/layout/Graph";
import "./Peers.scss";
import { PeersState } from "./PeersState";

/**
 * Peers panel.
 */
class Peers extends AsyncComponent<RouteComponentProps, PeersState> {
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
    constructor(props: RouteComponentProps) {
        super(props);

        this._metricsService = ServiceFactory.get<MetricsService>("metrics");

        this.state = {
            peers: []
        };
    }

    /**
     * The component mounted.
     */
    public componentDidMount(): void {
        super.componentDidMount();

        this._peersSubscription = this._metricsService.subscribe<IPeerMetric[]>(
            WebSocketTopic.PeerMetric,
            undefined,
            allData => {
                const peers: {
                    [id: string]: {
                        name: string;
                        address?: string;
                        connected: boolean;
                        incoming: number[];
                        outgoing: number[];
                    };
                } = {};

                for (const allDataPeers of allData) {
                    if (allDataPeers) {
                        for (const peer of allDataPeers) {
                            if (!peers[peer.identity]) {
                                peers[peer.identity] = {
                                    name: DataHelper.formatPeerName(peer),
                                    address: DataHelper.formatPeerAddress(peer),
                                    connected: peer.connected,
                                    incoming: [],
                                    outgoing: []
                                };
                            }

                            if (peer.info.numberOfNewTransactions !== undefined) {
                                peers[peer.identity].incoming.push(peer.info.numberOfNewTransactions);
                            }
                            if (peer.info.numberOfSentTransactions !== undefined) {
                                peers[peer.identity].outgoing.push(peer.info.numberOfSentTransactions);
                            }
                        }
                    }
                }

                this.setState({
                    peers: DataHelper.sortPeers(Object.values(peers))
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
            <div className="peers">
                <div className="content">
                    <h2>Peers</h2>
                    <div className="peers-panel">
                        {this.state.peers.length === 0 && (
                            <p className="margin-t-s">There are no peers.</p>
                        )}
                        {this.state.peers.map((p, idx) => (
                            <div className="peers-panel--item" key={idx}>
                                <div className="card col padding-m">
                                    <div className="row middle">
                                        <span className="peer-health">
                                            {p.connected ? <HealthGoodIcon /> : <HealthBadIcon />}
                                        </span>
                                        <div className="peer-id">{p.name}<br />{p.address}</div>
                                    </div>
                                    <Graph
                                        caption="Messages"
                                        seriesMaxLength={60}
                                        series={[
                                            {
                                                className: "bar-color-1",
                                                label: "Incoming",
                                                values: p.incoming
                                            },
                                            {
                                                className: "bar-color-2",
                                                label: "Outgoing",
                                                values: p.outgoing
                                            }
                                        ]}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(Peers);
