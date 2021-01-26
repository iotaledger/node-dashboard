import { IPeer } from "@iota/iota.js";
import React, { ReactNode } from "react";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";
import { ReactComponent as ChevronRightIcon } from "../../assets/chevron-right.svg";
import { ReactComponent as HealthBadIcon } from "../../assets/health-bad.svg";
import { ReactComponent as HealthGoodIcon } from "../../assets/health-good.svg";
import { ReactComponent as HealthWarningIcon } from "../../assets/health-warning.svg";
import { ServiceFactory } from "../../factories/serviceFactory";
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

        this._peersSubscription = this._metricsService.subscribe<IPeer[]>(
            WebSocketTopic.PeerMetric,
            undefined,
            allData => {
                const peers: {
                    [id: string]: {
                        id: string;
                        name: string;
                        address?: string;
                        health: number;
                        newMessagesTotal: number[];
                        sentMessagesTotal: number[];
                        newMessagesDiff: number[];
                        sentMessagesDiff: number[];
                    };
                } = {};

                for (const allDataPeers of allData) {
                    if (allDataPeers) {
                        for (const peer of allDataPeers) {
                            const name = DataHelper.formatPeerName(peer);
                            const address = DataHelper.formatPeerAddress(peer);
                            const health = DataHelper.calculateHealth(peer);

                            if (!peers[peer.id]) {
                                peers[peer.id] = {
                                    id: peer.id,
                                    name,
                                    address,
                                    health,
                                    newMessagesTotal: [],
                                    sentMessagesTotal: [],
                                    newMessagesDiff: [],
                                    sentMessagesDiff: []
                                };
                            } else {
                                peers[peer.id].name = name;
                                peers[peer.id].address = address;
                                peers[peer.id].health = health;
                            }
                            peers[peer.id].id = peer.id;

                            if (peer.gossip) {
                                peers[peer.id].newMessagesTotal.push(peer.gossip.metrics.newMessages);
                                peers[peer.id].sentMessagesTotal.push(peer.gossip.metrics.sentMessages);
                            }

                            peers[peer.id].newMessagesDiff = [];
                            for (let i = 1; i < peers[peer.id].newMessagesTotal.length; i++) {
                                peers[peer.id].newMessagesDiff.push(
                                    Math.max(
                                        peers[peer.id].newMessagesTotal[i] - peers[peer.id].newMessagesTotal[i - 1]
                                        , 0)
                                );
                            }
                            peers[peer.id].sentMessagesDiff = [];
                            for (let i = 1; i < peers[peer.id].sentMessagesTotal.length; i++) {
                                peers[peer.id].sentMessagesDiff.push(
                                    Math.max(
                                        peers[peer.id].sentMessagesTotal[i] - peers[peer.id].sentMessagesTotal[i - 1])
                                    , 0);
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
                                            {p.health === 0 && <HealthBadIcon />}
                                            {p.health === 1 && <HealthWarningIcon />}
                                            {p.health === 2 && <HealthGoodIcon />}
                                        </span>
                                        <div className="peer-id">{p.name}<br />{p.address}</div>
                                    </div>
                                    <Graph
                                        caption="Messages per Second"
                                        seriesMaxLength={60}
                                        series={[
                                            {
                                                className: "bar-color-1",
                                                label: "Incoming",
                                                values: p.newMessagesDiff
                                            },
                                            {
                                                className: "bar-color-2",
                                                label: "Outgoing",
                                                values: p.sentMessagesDiff
                                            }
                                        ]}
                                    />
                                    <div className="row right margin-t-s">
                                        <Link
                                            to={`/peers/${p.id}`}
                                            className="row middle inline"
                                        >
                                            <h3 className="secondary margin-r-s">More details</h3>
                                            <ChevronRightIcon className="secondary" />
                                        </Link>
                                    </div>
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
