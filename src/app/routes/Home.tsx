import React, { ReactNode } from "react";
import { ReactComponent as BannerCurve } from "../../assets/banner-curve.svg";
import { ReactComponent as MemoryIcon } from "../../assets/memory.svg";
import { ReactComponent as MilestoneIcon } from "../../assets/milestone.svg";
import { ReactComponent as PruningIcon } from "../../assets/pruning.svg";
import { ReactComponent as UptimeIcon } from "../../assets/uptime.svg";
import { ServiceFactory } from "../../factories/serviceFactory";
import { IMpsMetrics } from "../../models/websocket/IMpsMetrics";
import { INodeStatus } from "../../models/websocket/INodeStatus";
import { IPublicNodeStatus } from "../../models/websocket/IPublicNodeStatus";
import { ISyncStatus } from "../../models/websocket/ISyncStatus";
import { WebSocketTopic } from "../../models/websocket/webSocketTopic";
import { EventAggregator } from "../../services/eventAggregator";
import { MetricsService } from "../../services/metricsService";
import { NodeConfigService } from "../../services/nodeConfigService";
import { ThemeService } from "../../services/themeService";
import { BrandHelper } from "../../utils/brandHelper";
import { DataHelper } from "../../utils/dataHelper";
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
     * The mps metrics subscription id.
     */
    private _mpsMetricsSubscription?: string;

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

        const nodeConfigService = ServiceFactory.get<NodeConfigService>("node-config");
        this._networkId = nodeConfigService.getNetworkId();

        this.state = {
            nodeName: "",
            peerId: "",
            displayVersion: "",
            displayLatestVersion: "",
            lmi: "-",
            lsmi: "-",
            pruningIndex: "-",
            memory: "-",
            uptime: "-",
            lastReceivedMpsTime: 0,
            mpsIncoming: [],
            mpsOutgoing: [],
            bannerSrc: ""
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

        EventAggregator.subscribe("theme", "home", async theme => {
            this.setState({
                bannerSrc: await BrandHelper.getBanner(theme)
            });
        });

        this._publicNodeStatusSubscription = this._metricsService.subscribe<IPublicNodeStatus>(
            WebSocketTopic.PublicNodeStatus,
            data => {
                if (data) {
                    const pruningIndex = data.pruning_index.toString();

                    if (pruningIndex !== this.state.pruningIndex) {
                        this.setState({ pruningIndex });
                    }
                }
            });

        this._nodeStatusSubscription = this._metricsService.subscribe<INodeStatus>(
            WebSocketTopic.NodeStatus,
            data => {
                if (data) {
                    const nodeName = data.node_alias ? data.node_alias : BrandHelper.getConfiguration().name;
                    const peerId = data.autopeering_id || "No peer Id.";
                    const uptime = FormatHelper.duration(data.uptime);
                    const memory = FormatHelper.size(DataHelper.calculateMemoryUsage(data));

                    if (nodeName !== this.state.nodeName) {
                        this.setState({ nodeName });
                    }

                    if (peerId !== this.state.peerId) {
                        this.setState({ peerId });
                    }

                    if (uptime !== this.state.uptime) {
                        this.setState({ uptime });
                    }

                    if (memory !== this.state.memory) {
                        this.setState({ memory });
                    }

                    this.checkVersion(data.version, data.latest_version);
                }
            });

        this._syncStatusSubscription = this._metricsService.subscribe<ISyncStatus>(
            WebSocketTopic.SyncStatus,
            data => {
                if (data) {
                    const lmi = data.lmi ? data.lmi.toString() : "";
                    const lsmi = data.lsmi ? data.lsmi.toString() : "";

                    if (lmi !== this.state.lmi) {
                        this.setState({ lmi });
                    }

                    if (lsmi !== this.state.lsmi) {
                        this.setState({ lsmi });
                    }
                }
            });

        this._mpsMetricsSubscription = this._metricsService.subscribe<IMpsMetrics>(
            WebSocketTopic.MPSMetrics,
            undefined,
            allData => {
                const nonNull = allData.filter(d => d !== undefined && d !== null);

                const mpsIncoming = nonNull.map(m => m.incoming);
                const mpsOutgoing = nonNull.map(m => m.outgoing);

                this.setState({ mpsIncoming, mpsOutgoing, lastReceivedMpsTime: Date.now() });
            }
        );
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

        if (this._mpsMetricsSubscription) {
            this._metricsService.unsubscribe(this._mpsMetricsSubscription);
            this._mpsMetricsSubscription = undefined;
        }
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
                                    <h1>{this.state.nodeName}</h1>
                                    {this.state.peerId && (
                                        <p className="secondary margin-t-t word-break-all">{this.state.peerId}</p>
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
                                    caption="LSMI / LMI"
                                    value={`${this.state.lsmi} / ${this.state.lmi}`}
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
                                <div className="card fill messages-graph-panel">
                                    <Graph
                                        caption="Messages Per Second"
                                        seriesMaxLength={20}
                                        timeInterval={1000}
                                        endTime={this.state.lastReceivedMpsTime}
                                        series={[
                                            {
                                                className: "bar-color-1",
                                                label: "Incoming",
                                                values: this.state.mpsIncoming
                                            },
                                            {
                                                className: "bar-color-2",
                                                label: "Outgoing",
                                                values: this.state.mpsOutgoing
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
