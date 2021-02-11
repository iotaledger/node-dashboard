import { IPeer } from "@iota/iota.js";
import classNames from "classnames";
import React, { ReactNode } from "react";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";
import { ReactComponent as ChevronRightIcon } from "../../assets/chevron-right.svg";
import { ReactComponent as HealthBadIcon } from "../../assets/health-bad.svg";
import { ReactComponent as HealthGoodIcon } from "../../assets/health-good.svg";
import { ReactComponent as HealthWarningIcon } from "../../assets/health-warning.svg";
import { ServiceFactory } from "../../factories/serviceFactory";
import { WebSocketTopic } from "../../models/websocket/webSocketTopic";
import { MetricsService } from "../../services/metricsService";
import { TangleService } from "../../services/tangleService";
import { DataHelper } from "../../utils/dataHelper";
import AsyncComponent from "../components/layout/AsyncComponent";
import Dialog from "../components/layout/Dialog";
import Graph from "../components/layout/Graph";
import Spinner from "../components/layout/Spinner";
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
            peers: [],
            peerAddress: "",
            peerAlias: ""
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
                        originalAddress?: string;
                        health: number;
                        relation: string;
                        newMessagesTotal: number[];
                        sentMessagesTotal: number[];
                        newMessagesDiff: number[];
                        sentMessagesDiff: number[];
                        lastUpdateTime: number;
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
                                    relation: peer.relation,
                                    newMessagesTotal: [],
                                    sentMessagesTotal: [],
                                    newMessagesDiff: [],
                                    sentMessagesDiff: [],
                                    lastUpdateTime: 0
                                };
                            } else {
                                peers[peer.id].name = name;
                                peers[peer.id].address = address;
                                peers[peer.id].health = health;
                            }
                            peers[peer.id].id = peer.id;
                            peers[peer.id].relation = peer.relation;
                            peers[peer.id].lastUpdateTime = Date.now();
                            if (peer.multiAddresses?.length) {
                                peers[peer.id].originalAddress = peer.multiAddresses[0];
                            }

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
                                        peers[peer.id].sentMessagesTotal[i] - peers[peer.id].sentMessagesTotal[i - 1]
                                        , 0)
                                );
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
                    <div className="row spread">
                        <h2>Peers</h2>
                        <button
                            type="button"
                            className="add-button"
                            onClick={() => this.setState({
                                dialogType: "add",
                                dialogPeerId: undefined,
                                peerAddress: "",
                                peerAlias: ""
                            })}
                        >
                            Add Peer
                        </button>
                    </div>
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
                                        seriesMaxLength={15}
                                        timeInterval={1000}
                                        timeMarkers={5}
                                        endTime={p.lastUpdateTime}
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
                                    <div className="row spread middle margin-t-l">
                                        <button
                                            type="button"
                                            className="card--action card--action-danger"
                                            onClick={() => this.setState({
                                                dialogType: "delete",
                                                dialogPeerId: p.id
                                            })}
                                        >
                                            Delete
                                        </button>
                                        {p.relation !== "known" && p.originalAddress && (
                                            <button
                                                type="button"
                                                className="card--action"
                                                onClick={() => this.setState({
                                                    dialogType: "promote",
                                                    peerAddress: p.originalAddress ?? ""
                                                })}
                                            >
                                                Promote to Known
                                            </button>
                                        )}
                                        {p.relation === "known" && (
                                            <p>
                                                Relation:&nbsp;{`${p.relation
                                                    .slice(0, 1).toUpperCase()}${p.relation.slice(1)}`}
                                            </p>
                                        )}
                                        <Link
                                            to={`/peers/${p.id}`}
                                            className="card--action row middle inline"
                                        >
                                            <span className="margin-r-s">More details</span>
                                            <ChevronRightIcon className="secondary" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {this.state.dialogType && (
                        <Dialog
                            title={this.state.dialogType === "add" ? "Add Peer"
                                : (this.state.dialogType === "promote" ? "Promote to Known" : "Delete Confirmation")}
                            actions={[
                                <button
                                    type="button"
                                    onClick={() =>
                                    (this.state.dialogType === "add" ? this.peerAdd() : this.peerDelete()
                                    )}
                                    key={0}
                                    disabled={this.state.dialogBusy || (
                                        this.state.dialogType === "add" && this.state.peerAddress.length === 0
                                    )}
                                >
                                    {this.state.dialogType === "add" ? "OK" : "Yes"}
                                </button>,
                                <button
                                    type="button"
                                    onClick={() => this.setState({
                                        dialogPeerId: undefined,
                                        dialogType: undefined
                                    })}
                                    key={1}
                                    disabled={this.state.dialogBusy}
                                >
                                    {this.state.dialogType === "add" ? "Cancel" : "No"}
                                </button>
                            ]}
                        >
                            {this.state.dialogType === "delete" && (
                                <p className="margin-b-l">Are you sure you want to delete the peer?</p>
                            )}
                            {(this.state.dialogType === "add" || this.state.dialogType === "promote") && (
                                <React.Fragment>
                                    <p>Please enter the details of the peer to {this.state.dialogType}.</p>
                                    <div className="dialog--label">
                                        Address
                                    </div>
                                    <div className="dialog--value">
                                        <input
                                            type="text"
                                            className="input--stretch"
                                            placeholder="e.g. /ip4/127.0.0.1/tcp/15600"
                                            value={this.state.peerAddress}
                                            disabled={this.state.dialogBusy}
                                            onChange={e => this.setState({ peerAddress: e.target.value })}
                                        />
                                    </div>
                                    <div className="dialog--label">
                                        Alias
                                    </div>
                                    <div className="dialog--value">
                                        <input
                                            type="text"
                                            className="input--stretch"
                                            placeholder="e.g. My Friend's Node"
                                            value={this.state.peerAlias}
                                            disabled={this.state.dialogBusy}
                                            onChange={e => this.setState({ peerAlias: e.target.value })}
                                        />
                                    </div>
                                </React.Fragment>
                            )}
                            {this.state.dialogBusy && <Spinner />}
                            <p className={
                                classNames(
                                    "margin-t-l",
                                    { "danger": !this.state.dialogBusy }
                                )
                            }
                            >
                                {this.state.dialogStatus}
                            </p>
                        </Dialog>
                    )}
                </div>
            </div >
        );
    }

    /**
     * Add a new peer.
     */
    private peerAdd(): void {
        this.setState({
            dialogBusy: true,
            dialogStatus: this.state.dialogType === "add"
                ? "Adding peer, please wait..." : "Promoting peer, please wait..."
        }, async () => {
            const tangleService = ServiceFactory.get<TangleService>("tangle");

            try {
                await tangleService.peerAdd(this.state.peerAddress, this.state.peerAlias);

                this.setState({
                    dialogBusy: false,
                    dialogStatus: "",
                    dialogPeerId: undefined,
                    dialogType: undefined
                });
            } catch (err) {
                this.setState({
                    dialogBusy: false,
                    dialogStatus: `Failed to ${this.state.dialogType} peer: ${err.message}`
                });
            }
        });
    }

    /**
     * Delete the specified peer.
     */
    private peerDelete(): void {
        this.setState({
            dialogBusy: true,
            dialogStatus: "Deleting peer, please wait..."
        }, async () => {
            if (this.state.dialogPeerId) {
                const tangleService = ServiceFactory.get<TangleService>("tangle");

                try {
                    await tangleService.peerDelete(this.state.dialogPeerId);

                    this.setState({
                        dialogBusy: false,
                        dialogStatus: "",
                        dialogPeerId: undefined,
                        dialogType: undefined
                    });
                } catch (err) {
                    this.setState({
                        dialogBusy: false,
                        dialogStatus: `Failed to delete peer: ${err.message}`
                    });
                }
            }
        });
    }
}

export default withRouter(Peers);
