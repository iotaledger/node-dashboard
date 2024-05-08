import React, { ReactNode } from "react";
import { ReactComponent as BannerCurve } from "../../assets/banner-curve.svg";
import { ReactComponent as ConfirmationIcon } from "../../assets/confirmation.svg";
import { ReactComponent as DbIcon } from "../../assets/db-icon.svg";
import { ReactComponent as MemoryIcon } from "../../assets/memory.svg";
import { ReactComponent as PruningIcon } from "../../assets/pruning.svg";
import { ReactComponent as SlotIcon } from "../../assets/slot.svg";
import { ReactComponent as UptimeIcon } from "../../assets/uptime.svg";
import { ServiceFactory } from "../../factories/serviceFactory";
import { INetworkMetrics } from "../../models/info/INetworkMetrics";
import { IDatabaseSizesMetrics } from "../../models/websocket/IDatabaseSizesMetrics";
import { IGossipMetrics } from "../../models/websocket/IGossipMetrics";
import { INodeInfoExtended } from "../../models/websocket/INodeInfoExtended";
import { IPublicNodeStatus } from "../../models/websocket/IPublicNodeStatus";
import { ISyncStatus } from "../../models/websocket/ISyncStatus";
import { WebSocketTopic } from "../../models/websocket/webSocketTopic";
import { EventAggregator } from "../../services/eventAggregator";
import { MetricsService } from "../../services/metricsService";
import { NodeConfigService } from "../../services/nodeConfigService";
import { SettingsService } from "../../services/settingsService";
import { ThemeService } from "../../services/themeService";
import { BrandHelper } from "../../utils/brandHelper";
import { FormatHelper } from "../../utils/formatHelper";
import AsyncComponent from "../components/layout/AsyncComponent";
import Graph from "../components/layout/Graph";
import InfoPanel from "../components/layout/InfoPanel";
import PeersSummaryPanel from "../components/tangle/PeersSummaryPanel";
import "./Home.scss";
import { HomeState } from "./HomeState";

/**
 * Home panel.
 */
class Home extends AsyncComponent<unknown, HomeState> {
    /**
     * The theme service.
     */
    private readonly _themeService: ThemeService;

    /**
     * The metrics service.
     */
    private readonly _metricsService: MetricsService;

    /**
     * The settings service.
     */
    private readonly _settingsService: SettingsService;

    /**
     * The node info extended subscription id.
     */
    private _nodeInfoExtendedSubscription?: string;

    /**
     * The public node status subscription id.
     */
    private _publicNodeStatusSubscription?: string;

    /**
     * The sync status subscription id.
     */
    private _syncStatusSubscription?: string;

    /**
     * The network metrics subscription id.
     */
    private _networkMetricsSubscription?: string;

    /**
     * The gossip metrics subscription id.
     */
    private _gossipMetricsSubscription?: string;

    /**
     * The database size metrics subscription id.
     */
    private _databaseSizeSubscription?: string;

    /**
     * The network id.
     */
    private readonly _networkId?: string;

    /**
     * Create a new instance of Home.
     * @param props The props.
     */
    constructor(props: unknown) {
        super(props);

        this._metricsService = ServiceFactory.get<MetricsService>("metrics");
        this._themeService = ServiceFactory.get<ThemeService>("theme");
        this._settingsService = ServiceFactory.get<SettingsService>("settings");

        const nodeConfigService = ServiceFactory.get<NodeConfigService>("node-config");
        this._networkId = nodeConfigService.getNetworkId();

        this.state = {
            nodeName: "",
            nodeId: "",
            displayVersion: "",
            displayLatestVersion: "",
            latestCommitmentSlot: "-",
            latestFinalizedSlot: "-",
            pruningEpoch: "-",
            bps: "-",
            rbps: "-",
            referencedRate: "-",
            memory: "-",
            dbSizePermanentFormatted: "-",
            dbSizePrunableFormatted: "-",
            dbSizeTxRetainerFormatted: "-",
            dbSizeTotalFormatted: "-",
            uptime: "-",
            lastReceivedBpsTime: 0,
            bpsIncoming: [],
            bpsOutgoing: [],
            bannerSrc: "",
            blindMode: this._settingsService.getBlindMode()
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        super.componentDidMount();

        this.setState({
            bannerSrc: await BrandHelper.getBanner(this._themeService.get())
        });

        EventAggregator.subscribe("theme", "home", async (theme: string) => {
            this.setState({
                bannerSrc: await BrandHelper.getBanner(theme)
            });
        });

        this._publicNodeStatusSubscription = this._metricsService.subscribe<IPublicNodeStatus>(
            WebSocketTopic.PublicNodeStatus,
            data => {
                if (data) {
                    const pruningEpoch = data.pruningEpoch.toString();

                    if (pruningEpoch !== this.state.pruningEpoch) {
                        this.setState({ pruningEpoch });
                    }
                }
            });

        this._nodeInfoExtendedSubscription = this._metricsService.subscribe<INodeInfoExtended>(
            WebSocketTopic.NodeInfoExtended,
            data => {
                if (data) {
                    const nodeName = data.nodeAlias ?? BrandHelper.getConfiguration().name;
                    const nodeId = data.nodeId || "No node Id.";
                    const uptime = FormatHelper.duration(Number.parseInt(data.uptime, 10));
                    const memory = FormatHelper.iSize(Number.parseInt(data.memoryUsage, 10));

                    if (nodeName !== this.state.nodeName) {
                        this.setState({ nodeName });
                    }

                    if (nodeId !== this.state.nodeId) {
                        this.setState({ nodeId });
                    }

                    if (uptime !== this.state.uptime) {
                        this.setState({ uptime });
                    }

                    if (memory !== this.state.memory) {
                        this.setState({ memory });
                    }

                    this.checkVersion(data.version, data.latestVersion);
                }
            });

        this._syncStatusSubscription = this._metricsService.subscribe<ISyncStatus>(
            WebSocketTopic.SyncStatus,
            data => {
                if (data) {
                    const latestFinalizedSlot = data.latestFinalizedSlot ? data.latestFinalizedSlot.toString() : "";
                    const latestCommitmentSlot = data.latestCommitmentSlot ? data.latestCommitmentSlot.toString() : "";

                    if (latestFinalizedSlot !== this.state.latestFinalizedSlot) {
                        this.setState({ latestFinalizedSlot });
                    }

                    if (latestCommitmentSlot !== this.state.latestCommitmentSlot) {
                        this.setState({ latestCommitmentSlot });
                    }
                }
            });

        this._networkMetricsSubscription = this._metricsService.subscribe<INetworkMetrics>(
            WebSocketTopic.NetworkMetrics,
            data => {
                if (data) {
                    let bps = "-";
                    let rbps = "-";
                    let referencedRate = "-";

                    if (data.blocksPerSecond) {
                        bps = Number.parseFloat(data.blocksPerSecond).toFixed(1)
                            .toString();
                    }
                    if (data.confirmedBlocksPerSecond) {
                        rbps = Number.parseFloat(data.confirmedBlocksPerSecond).toFixed(1)
                            .toString();
                    }
                    if (data.confirmationRate) {
                        referencedRate = `${Number.parseFloat(data.confirmationRate).toFixed(1)
                            .toString()}%`;
                    }

                    this.setState({
                        bps,
                        rbps,
                        referencedRate
                    });
                }
            }
        );

        this._gossipMetricsSubscription = this._metricsService.subscribe<IGossipMetrics>(
            WebSocketTopic.GossipMetrics,
            undefined,
            allData => {
                const nonNull = allData.filter(d => d !== undefined && d !== null);

                const bpsIncoming = nonNull.map(m => m.incoming);
                const bpsOutgoing = nonNull.map(m => m.outgoing);

                this.setState({ bpsIncoming, bpsOutgoing, lastReceivedBpsTime: Date.now() });
            }
        );

        this._databaseSizeSubscription = this._metricsService.subscribe<IDatabaseSizesMetrics>(
            WebSocketTopic.DatabaseSizeMetric,
            data => {
                if (data) {
                    if (data.databaseSizes.length === 0) {
                        return;
                    }

                    const dbSizeMetric = data.databaseSizes[0];

                    const dbSizePermanentFormatted = FormatHelper.size(Number.parseInt(dbSizeMetric.permanent, 10));
                    if (dbSizePermanentFormatted !== this.state.dbSizePermanentFormatted) {
                        this.setState({ dbSizePermanentFormatted });
                    }

                    const dbSizePrunableFormatted = FormatHelper.size(Number.parseInt(dbSizeMetric.prunable, 10));
                    if (dbSizePrunableFormatted !== this.state.dbSizePrunableFormatted) {
                        this.setState({ dbSizePrunableFormatted });
                    }

                    const dbSizeTxRetainerFormatted = FormatHelper.size(Number.parseInt(dbSizeMetric.txRetainer, 10));
                    if (dbSizeTxRetainerFormatted !== this.state.dbSizeTxRetainerFormatted) {
                        this.setState({ dbSizeTxRetainerFormatted });
                    }

                    const dbSizeTotalFormatted = FormatHelper.size(Number.parseInt(dbSizeMetric.total, 10));
                    if (dbSizeTotalFormatted !== this.state.dbSizeTotalFormatted) {
                        this.setState({ dbSizeTotalFormatted });
                    }
                }
            });

        EventAggregator.subscribe("settings.blindMode", "home", blindMode => {
            this.setState({ blindMode });
        });
    }

    /**
     * The component will unmount.
     */
    public componentWillUnmount(): void {
        super.componentWillUnmount();

        EventAggregator.unsubscribe("theme", "home");

        if (this._nodeInfoExtendedSubscription) {
            this._metricsService.unsubscribe(this._nodeInfoExtendedSubscription);
            this._nodeInfoExtendedSubscription = undefined;
        }

        if (this._publicNodeStatusSubscription) {
            this._metricsService.unsubscribe(this._publicNodeStatusSubscription);
            this._publicNodeStatusSubscription = undefined;
        }

        if (this._syncStatusSubscription) {
            this._metricsService.unsubscribe(this._syncStatusSubscription);
            this._syncStatusSubscription = undefined;
        }

        if (this._networkMetricsSubscription) {
            this._metricsService.unsubscribe(this._networkMetricsSubscription);
            this._networkMetricsSubscription = undefined;
        }

        if (this._gossipMetricsSubscription) {
            this._metricsService.unsubscribe(this._gossipMetricsSubscription);
            this._gossipMetricsSubscription = undefined;
        }

        if (this._databaseSizeSubscription) {
            this._metricsService.unsubscribe(this._databaseSizeSubscription);
            this._databaseSizeSubscription = undefined;
        }

        EventAggregator.unsubscribe("settings.blindMode", "home");
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="home">
                <div className="content">
                    <div className="card">
                        <div className="banner row">
                            <div className="node-info">
                                <div>
                                    <h1>{this.state.blindMode ? "**********" : this.state.nodeName}</h1>
                                    {this.state.nodeId && (
                                        <p className="secondary margin-t-t word-break-all">
                                            {this.state.blindMode ? "*********" : this.state.nodeId}
                                        </p>
                                    )}
                                </div>
                                <p className="secondary">
                                    {this._networkId}
                                </p>
                                <p className="secondary">
                                    {this.state.displayVersion}{this.state.displayLatestVersion}
                                </p>
                            </div>
                            <BannerCurve className="banner-curve" />
                            <div className="banner-image">
                                <img src={this.state.bannerSrc} />
                            </div>
                        </div>
                    </div>
                    <div className="row fill margin-t-s desktop-down-column">
                        <div className="col info-col fill">
                            <div className="row tablet-down-column">
                                <InfoPanel
                                    caption="Finalized Slot / Committed Slot"
                                    value={`${this.state.latestFinalizedSlot} / ${this.state.latestCommitmentSlot}`}
                                    icon={<SlotIcon />}
                                    iconStyle="green"
                                />
                                <InfoPanel
                                    caption="Pruning Epoch"
                                    value={this.state.pruningEpoch}
                                    icon={<PruningIcon />}
                                    iconStyle="orange"
                                />
                            </div>
                            <div className="row margin-t-s tablet-down-column">
                                <InfoPanel
                                    caption="Uptime"
                                    value={this.state.uptime}
                                    icon={<UptimeIcon />}
                                    iconStyle="blue"
                                />
                                <InfoPanel
                                    caption="Memory Usage"
                                    value={this.state.memory}
                                    icon={<MemoryIcon />}
                                    iconStyle="purple"
                                />
                            </div>
                            <div className="row margin-t-s tablet-down-column">
                                <InfoPanel
                                    caption="Permanent DB Size"
                                    value={this.state.dbSizePermanentFormatted}
                                    icon={<DbIcon />}
                                    iconStyle="purple"
                                />
                                <InfoPanel
                                    caption="Prunable DB Size"
                                    value={this.state.dbSizePrunableFormatted}
                                    icon={<DbIcon />}
                                    iconStyle="purple"
                                />
                            </div>
                            <div className="row margin-t-s tablet-down-column">
                                <InfoPanel
                                    caption="TxRetainer DB Size"
                                    value={this.state.dbSizeTxRetainerFormatted}
                                    icon={<DbIcon />}
                                    iconStyle="purple"
                                />
                                <InfoPanel
                                    caption="Total DB Size"
                                    value={this.state.dbSizeTotalFormatted}
                                    icon={<DbIcon />}
                                    iconStyle="purple"
                                />
                            </div>
                            <div className="row margin-t-s tablet-down-column">
                                <div className="card fill blocks-graph-panel">
                                    <Graph
                                        caption="Blocks Per Second"
                                        seriesMaxLength={20}
                                        timeInterval={1000}
                                        endTime={this.state.lastReceivedBpsTime}
                                        series={[
                                            {
                                                className: "bar-color-1",
                                                label: "Incoming",
                                                values: this.state.bpsIncoming
                                            },
                                            {
                                                className: "bar-color-2",
                                                label: "Outgoing",
                                                values: this.state.bpsOutgoing
                                            }
                                        ]}
                                    />
                                </div>
                            </div>
                            <div className="row margin-t-s tablet-down-column">
                                <InfoPanel
                                    caption="Blocks per Second"
                                    value={this.state.bps}
                                    icon={<SlotIcon />}
                                    iconStyle="blue"
                                />
                                <InfoPanel
                                    caption="Referenced Blocks per Second"
                                    value={this.state.rbps}
                                    icon={<UptimeIcon />}
                                    iconStyle="blue"
                                />
                                <InfoPanel
                                    caption="Referenced Rate"
                                    value={this.state.referencedRate}
                                    icon={<ConfirmationIcon />}
                                    iconStyle="blue"
                                />
                            </div>
                        </div>
                        <div className="card col peers-summary-col peers-summary-panel">
                            <PeersSummaryPanel />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Check to see if a new version is available.
     * @param currentVersion The current version.
     * @param latestVersion The latest resion.
     */
    private checkVersion(currentVersion: string, latestVersion: string): void {
        if (this.state.version !== currentVersion ||
            this.state.latestVersion !== latestVersion) {
            const comparison = this.compareVersions(currentVersion, latestVersion);

            this.setState({
                version: currentVersion,
                latestVersion,
                displayVersion: currentVersion
            });

            if (comparison < 0) {
                this.setState({ displayLatestVersion: ` - a new version ${latestVersion} is available.` });
            }
        }
    }

    /**
     * Compare two versions.
     * @param first The first version.
     * @param second The second versions.
     * @returns 0 if the same, 1 if a > b or -1 if a < b.
     */
    private compareVersions(first: string, second: string): number {
        const partsFirst = first.split(".");
        const partsSecond = second.split(".");

        if (partsFirst.length === 3 && partsSecond.length === 3) {
            for (let i = 0; i < 3; i++) {
                const na = Number.parseInt(partsFirst[i], 10);
                const nb = Number.parseInt(partsSecond[i], 10);
                if (na > nb) {
                    return 1;
                }
                if (nb > na) {
                    return -1;
                }

                if (i === 2) {
                    let firstAlphabet = 96;
                    let secondAlphabet = 96;
                    const firstIndex = partsFirst[i].indexOf("-");
                    if (firstIndex > 0) {
                        firstAlphabet = partsFirst[i].codePointAt(firstIndex + 1) ?? Number.NaN;
                    }
                    const secondIndex = partsSecond[i].indexOf("-");
                    if (secondIndex > 0) {
                        secondAlphabet = partsSecond[i].codePointAt(secondIndex + 1) ?? Number.NaN;
                    }

                    return firstAlphabet - secondAlphabet;
                }
            }
        }

        return 0;
    }
}

export default Home;
