import React, { ReactNode } from "react";
import { ReactComponent as BannerCurve } from "../../assets/banner-curve.svg";
import { ReactComponent as MemoryIcon } from "../../assets/memory.svg";
import { ReactComponent as MilestoneIcon } from "../../assets/milestone.svg";
import { ReactComponent as PruningIcon } from "../../assets/pruning.svg";
import { ReactComponent as UptimeIcon } from "../../assets/uptime.svg";
import { ServiceFactory } from "../../factories/serviceFactory";
import { IBpsMetrics } from "../../models/websocket/IBpsMetrics";
import { INodeStatus } from "../../models/websocket/INodeStatus";
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
     * The status subscription id.
     */
    private _nodeStatusSubscription?: string;

    /**
     * The public node status subscription id.
     */
    private _publicNodeStatusSubscription?: string;

    /**
     * The sync status subscription id.
     */
    private _syncStatusSubscription?: string;

    /**
     * The bps metrics subscription id.
     */
    private _bpsMetricsSubscription?: string;

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
            lmi: "-",
            cmi: "-",
            pruningIndex: "-",
            memory: "-",
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
                    const pruningIndex = data.pruningIndex.toString();

                    if (pruningIndex !== this.state.pruningIndex) {
                        this.setState({ pruningIndex });
                    }
                }
            });

        this._nodeStatusSubscription = this._metricsService.subscribe<INodeStatus>(
            WebSocketTopic.NodeStatus,
            data => {
                if (data) {
                    const nodeName = data.nodeAlias ? data.nodeAlias : BrandHelper.getConfiguration().name;
                    const nodeId = data.nodeId || "No node Id.";
                    const uptime = FormatHelper.duration(data.uptime);
                    const memory = FormatHelper.iSize(data.memUsage);

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
                    const lmi = data.lmi ? data.lmi.toString() : "";
                    const cmi = data.cmi ? data.cmi.toString() : "";

                    if (lmi !== this.state.lmi) {
                        this.setState({ lmi });
                    }

                    if (cmi !== this.state.cmi) {
                        this.setState({ cmi });
                    }
                }
            });

        this._bpsMetricsSubscription = this._metricsService.subscribe<IBpsMetrics>(
            WebSocketTopic.BPSMetrics,
            undefined,
            allData => {
                const nonNull = allData.filter(d => d !== undefined && d !== null);

                const bpsIncoming = nonNull.map(m => m.incoming);
                const bpsOutgoing = nonNull.map(m => m.outgoing);

                this.setState({ bpsIncoming, bpsOutgoing, lastReceivedBpsTime: Date.now() });
            }
        );

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

        if (this._nodeStatusSubscription) {
            this._metricsService.unsubscribe(this._nodeStatusSubscription);
            this._nodeStatusSubscription = undefined;
        }

        if (this._publicNodeStatusSubscription) {
            this._metricsService.unsubscribe(this._publicNodeStatusSubscription);
            this._publicNodeStatusSubscription = undefined;
        }

        if (this._syncStatusSubscription) {
            this._metricsService.unsubscribe(this._syncStatusSubscription);
            this._syncStatusSubscription = undefined;
        }

        if (this._bpsMetricsSubscription) {
            this._metricsService.unsubscribe(this._bpsMetricsSubscription);
            this._bpsMetricsSubscription = undefined;
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
                                    caption="CMI / LMI"
                                    value={`${this.state.cmi} / ${this.state.lmi}`}
                                    icon={<MilestoneIcon />}
                                    backgroundStyle="green"
                                />
                                <InfoPanel
                                    caption="Pruning Index"
                                    value={this.state.pruningIndex?.toString()}
                                    icon={<PruningIcon />}
                                    backgroundStyle="orange"
                                />
                            </div>
                            <div className="row margin-t-s tablet-down-column">
                                <InfoPanel
                                    caption="Uptime"
                                    value={this.state.uptime}
                                    icon={<UptimeIcon />}
                                    backgroundStyle="blue"
                                />
                                <InfoPanel
                                    caption="Memory Usage"
                                    value={this.state.memory}
                                    icon={<MemoryIcon />}
                                    backgroundStyle="purple"
                                />
                            </div>
                            <div className="row margin-t-s">
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
                        firstAlphabet = partsFirst[i].charCodeAt(firstIndex + 1);
                    }
                    const secondIndex = partsSecond[i].indexOf("-");
                    if (secondIndex > 0) {
                        secondAlphabet = partsSecond[i].charCodeAt(secondIndex + 1);
                    }

                    return firstAlphabet - secondAlphabet;
                }
            }
        }

        return 0;
    }
}

export default Home;
