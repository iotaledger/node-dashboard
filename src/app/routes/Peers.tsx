import { IPeer } from "@iota/iota.js";
import classNames from "classnames";
import React, { ReactNode } from "react";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";
import { ReactComponent as ChevronRightIcon } from "../../assets/chevron-right.svg";
import { ReactComponent as EyeClosedIcon } from "../../assets/eye-closed.svg";
import { ReactComponent as EyeIcon } from "../../assets/eye.svg";
import { ReactComponent as HealthBadIcon } from "../../assets/health-bad.svg";
import { ReactComponent as HealthGoodIcon } from "../../assets/health-good.svg";
import { ReactComponent as HealthWarningIcon } from "../../assets/health-warning.svg";
import { ServiceFactory } from "../../factories/serviceFactory";
import { ISyncStatus } from "../../models/websocket/ISyncStatus";
import { WebSocketTopic } from "../../models/websocket/webSocketTopic";
import { MetricsService } from "../../services/metricsService";
import { SettingsService } from "../../services/settingsService";
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
     * The settings service.
     */
    private readonly _settingsService: SettingsService;

    /**
     * The peers subscription id.
     */
    private _peersSubscription?: string;

    /**
     * The sync status subscription id.
     */
    private _syncStatusSubscription?: string;

    /**
     * Create a new instance of Peers.
     * @param props The props.
     */
    constructor(props: RouteComponentProps) {
        super(props);

        this._metricsService = ServiceFactory.get<MetricsService>("metrics");
        this._settingsService = ServiceFactory.get<SettingsService>("settings");

        this.state = {
            peers: [],
            dialogPeerAddress: "",
            dialogPeerAlias: "",
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
                const peers: {
                    [id: string]: {
                        id: string;
                        alias?: string;
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

                if (allData.length > 0) {
                    // Only track data for the peers that appear in the most recent list.
                    const finalPeerIds = new Set(allData[allData.length - 1].map(p => p.id));

                    for (const allDataPeers of allData) {
                        if (allDataPeers) {
                            for (const peer of allDataPeers) {
                                if (finalPeerIds.has(peer.id)) {
                                    const address = DataHelper.formatPeerAddress(peer);
                                    const cmi = this.state.cmi ? this.state.cmi : 0;
                                    const lmi = this.state.lmi ? this.state.lmi : 0;
                                    const health = DataHelper.calculateHealth(peer, cmi, lmi);

                                    if (!peers[peer.id]) {
                                        peers[peer.id] = {
                                            id: peer.id,
                                            address: "",
                                            health: 0,
                                            relation: peer.relation,
                                            newMessagesTotal: [],
                                            sentMessagesTotal: [],
                                            newMessagesDiff: [],
                                            sentMessagesDiff: [],
                                            lastUpdateTime: 0
                                        };
                                    }
                                    peers[peer.id].id = peer.id;
                                    peers[peer.id].alias = peer.alias;
                                    peers[peer.id].address = address;
                                    peers[peer.id].health = health;
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
                                                peers[peer.id].newMessagesTotal[i] -
                                                peers[peer.id].newMessagesTotal[i - 1]
                                                , 0)
                                        );
                                    }
                                    peers[peer.id].sentMessagesDiff = [];
                                    for (let i = 1; i < peers[peer.id].sentMessagesTotal.length; i++) {
                                        peers[peer.id].sentMessagesDiff.push(
                                            Math.max(
                                                peers[peer.id].sentMessagesTotal[i] -
                                                peers[peer.id].sentMessagesTotal[i - 1]
                                                , 0)
                                        );
                                    }
                                }
                            }
                        }
                    }
                }

                this.setState({
                    peers: DataHelper.sortPeers(Object.values(peers))
                });
            }
        );

        this._syncStatusSubscription = this._metricsService.subscribe<ISyncStatus>(
            WebSocketTopic.SyncStatus,
            data => {
                if (data) {
                    const cmi = data.cmi;
                    const lmi = data.lmi;

                    if (cmi && cmi !== this.state.cmi) {
                        this.setState({ cmi });
                    }

                    if (lmi && lmi !== this.state.lmi) {
                        this.setState({ lmi });
                    }
                }
            });
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

        if (this._syncStatusSubscription) {
            this._metricsService.unsubscribe(this._syncStatusSubscription);
            this._syncStatusSubscription = undefined;
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
                        <div className="row">
                            <button
                                type="button"
                                onClick={() => this.toggleBlindMode()}
                                className="peers--icon-button"
                            >
                                {this.state.blindMode ? <EyeIcon /> : <EyeClosedIcon />}
                            </button>

                            <button
                                type="button"
                                className="add-button"
                                onClick={() => this.setState({
                                    dialogType: "add",
                                    dialogIsEdit: true,
                                    dialogPeerId: "",
                                    dialogPeerAddress: "",
                                    dialogPeerAlias: "",
                                    dialogStatus: "",
                                    dialogBusy: false
                                })}
                            >
                                Add Peer
                            </button>
                        </div>
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
                                        <div className="peer-id word-break-all">
                                            <span>
                                                {this.state.blindMode && ("*".repeat((p.alias ?? p.id).length))}
                                                {!this.state.blindMode && (p.alias ?? p.id)}
                                            </span>
                                            <span>{this.state.blindMode
                                                ? "*".repeat(p.address?.length ?? 10) : p.address}
                                            </span>
                                        </div>
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
                                    <div className="row peer-actions">
                                        <p className="margin-t-s padding-t">
                                            Relation: {`${p.relation
                                                .slice(0, 1).toUpperCase()}${p.relation.slice(1)}`}
                                        </p>
                                        {p.relation !== "known" && p.originalAddress && (
                                            <button
                                                type="button"
                                                className="card--action margin-t-s"
                                                onClick={() => this.setState({
                                                    dialogType: "promote",
                                                    dialogIsEdit: true,
                                                    dialogPeerAddress: p.originalAddress ?? "",
                                                    dialogPeerAlias: "",
                                                    dialogPeerId: p.id,
                                                    dialogStatus: "",
                                                    dialogBusy: false
                                                })}
                                            >
                                                Promote to Known
                                            </button>
                                        )}
                                        {p.relation === "known" && (
                                            <button
                                                type="button"
                                                className="card--action margin-t-s"
                                                onClick={() => this.setState({
                                                    dialogType: "edit",
                                                    dialogIsEdit: true,
                                                    dialogPeerAddress: p.originalAddress ?? "",
                                                    dialogPeerAlias: p.alias ?? "",
                                                    dialogPeerId: p.id,
                                                    dialogPeerIdOriginal: p.id,
                                                    dialogStatus: "",
                                                    dialogBusy: false
                                                })}
                                            >
                                                Edit
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="card--action card--action-danger margin-t-s"
                                            onClick={() => this.setState({
                                                dialogType: "delete",
                                                dialogIsEdit: false,
                                                dialogPeerId: p.id,
                                                dialogPeerAddress: "",
                                                dialogPeerAlias: "",
                                                dialogStatus: "",
                                                dialogBusy: false
                                            })}
                                        >
                                            Delete
                                        </button>
                                        <Link
                                            to={`/peers/${p.id}`}
                                            className="card--action row middle inline margin-t-s"
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
                            title={{
                                "add": "Add Peer",
                                "edit": "Edit Peer",
                                "promote": "Promote to Known",
                                "delete": "Delete Confirmation"
                            }[this.state.dialogType]}
                            actions={[
                                <button
                                    type="button"
                                    onClick={() =>
                                        (this.state.dialogIsEdit ? this.peerConfigure() : this.peerDelete())}
                                    key={0}
                                    disabled={this.state.dialogBusy || (
                                        this.state.dialogIsEdit &&
                                        (this.state.dialogPeerAddress.trim().length === 0 ||
                                            this.state.dialogPeerId?.trim().length === 0)
                                    )}
                                >
                                    {this.state.dialogIsEdit ? "OK" : "Yes"}
                                </button>,
                                <button
                                    type="button"
                                    onClick={() => this.setState({
                                        dialogPeerId: undefined,
                                        dialogPeerIdOriginal: undefined,
                                        dialogType: undefined
                                    })}
                                    key={1}
                                    disabled={this.state.dialogBusy}
                                >
                                    {this.state.dialogIsEdit ? "Cancel" : "No"}
                                </button>
                            ]}
                        >
                            {this.state.dialogType === "delete" && (
                                <p className="margin-b-l">Are you sure you want to delete the peer?</p>
                            )}
                            {this.state.dialogIsEdit && (
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
                                            value={this.state.dialogPeerAddress}
                                            disabled={this.state.dialogBusy}
                                            onChange={e => this.setState({ dialogPeerAddress: e.target.value })}
                                        />
                                    </div>
                                    <div className="dialog--label">
                                        Id
                                    </div>
                                    <div className="dialog--value">
                                        <input
                                            type="text"
                                            className="input--stretch"
                                            placeholder="e.g. 12D3KooWC7uE9w3RN4Vh1FJAZa8SbE8yMWR6wCVBajcWpyWguV73"
                                            value={this.state.dialogPeerId}
                                            disabled={this.state.dialogBusy}
                                            onChange={e => this.setState({ dialogPeerId: e.target.value })}
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
                                            value={this.state.dialogPeerAlias}
                                            disabled={this.state.dialogBusy}
                                            onChange={e => this.setState({ dialogPeerAlias: e.target.value })}
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
    private peerConfigure(): void {
        this.setState({
            dialogBusy: true,
            dialogStatus: this.state.dialogType === "add"
                ? "Adding peer, please wait..." : "Promoting peer, please wait..."
        }, async () => {
            const tangleService = ServiceFactory.get<TangleService>("tangle");

            try {
                if (this.state.dialogType === "edit" && this.state.dialogPeerIdOriginal) {
                    await tangleService.peerDelete(this.state.dialogPeerIdOriginal);
                }
                let addr = this.state.dialogPeerAddress;
                if (!addr.endsWith("/")) {
                    addr += "/";
                }
                addr += `p2p/${this.state.dialogPeerId}`;
                await tangleService.peerAdd(addr, this.state.dialogPeerAlias);

                this.setState({
                    dialogBusy: false,
                    dialogStatus: "",
                    dialogPeerId: undefined,
                    dialogType: undefined
                });
            } catch (error) {
                if (error instanceof Error) {
                    this.setState({
                        dialogBusy: false,
                        dialogStatus: `Failed to ${this.state.dialogType} peer: ${error.message}`
                    });
                }
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
                } catch (error) {
                    if (error instanceof Error) {
                        this.setState({
                            dialogBusy: false,
                            dialogStatus: `Failed to delete peer: ${error.message}`
                        });
                    }
                }
            }
        });
    }

    /**
     * Toggle the flag for blind mode.
     */
    private toggleBlindMode(): void {
        this._settingsService.setBlindMode(!this.state.blindMode);
        this.setState({ blindMode: !this.state.blindMode });
    }
}

export default withRouter(Peers);
