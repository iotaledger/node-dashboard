import React, { ReactNode } from "react";
import { ReactComponent as BannerCurve } from "../../assets/banner-curve.svg";
import { ReactComponent as MemoryIcon } from "../../assets/memory.svg";
import { ReactComponent as MilestoneIcon } from "../../assets/milestone.svg";
import { ReactComponent as PruningIcon } from "../../assets/pruning.svg";
import { ReactComponent as UptimeIcon } from "../../assets/uptime.svg";
import { ServiceFactory } from "../../factories/serviceFactory";
import { IStatus } from "../../models/websocket/IStatus";
import { ISyncStatus } from "../../models/websocket/ISyncStatus";
import { ITpsMetrics } from "../../models/websocket/ITpsMetrics";
import { WebSocketTopic } from "../../models/websocket/webSocketTopic";
import { MetricsService } from "../../services/metricsService";
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
     * The theme subscription id.
     */
    private _themeSubscriptionId?: string;

    /**
     * The metrics service.
     */
    private readonly _metricsService: MetricsService;

    /**
     * The status subscription id.
     */
    private _statusSubscription?: string;

    /**
     * The sync status subscription id.
     */
    private _syncStatusSubscription?: string;

    /**
     * The mps metrics subscription id.
     */
    private _mpsMetricsSubscription?: string;

    /**
     * Create a new instance of Home.
     * @param props The props.
     */
    constructor(props: unknown) {
        super(props);

        this._metricsService = ServiceFactory.get<MetricsService>("metrics");
        this._themeService = ServiceFactory.get<ThemeService>("theme");

        this.state = {
            nodeName: "",
            autoPeeringId: "No auto peering id",
            version: "",
            lmi: "-",
            lsmi: "-",
            pruningIndex: "-",
            memory: "-",
            uptime: "-",
            mpsIncoming: [],
            mpsOutgoing: [],
            bannerSrc: BrandHelper.getBanner(this._themeService.get())
        };
    }

    /**
     * The component mounted.
     */
    public componentDidMount(): void {
        super.componentDidMount();

        this._themeSubscriptionId = this._themeService.subscribe(() => {
            this.setState({ bannerSrc: BrandHelper.getBanner(this._themeService.get()) });
        });

        this._statusSubscription = this._metricsService.subscribe<IStatus>(
            WebSocketTopic.Status, data => {
                const nodeName = data.node_alias ? data.node_alias : BrandHelper.getConfiguration().name;
                const version = data.version;
                const autoPeeringId = data.autopeering_id || "No autopeering Id";
                const pruningIndex = data.pruning_index.toString();
                const uptime = FormatHelper.duration(data.uptime);
                const memory = FormatHelper.size(
                    data.mem.heap_inuse +
                    (data.mem.heap_idle - data.mem.heap_released) +
                    data.mem.m_span_inuse +
                    data.mem.m_cache_inuse +
                    data.mem.stack_sys);

                if (nodeName !== this.state.nodeName) {
                    this.setState({ nodeName });
                }

                if (version !== this.state.version) {
                    this.setState({ version });
                }

                if (autoPeeringId !== this.state.autoPeeringId) {
                    this.setState({ autoPeeringId });
                }

                if (pruningIndex !== this.state.pruningIndex) {
                    this.setState({ pruningIndex });
                }

                if (uptime !== this.state.uptime) {
                    this.setState({ uptime });
                }

                if (memory !== this.state.memory) {
                    this.setState({ memory });
                }
            });

        this._syncStatusSubscription = this._metricsService.subscribe<ISyncStatus>(
            WebSocketTopic.SyncStatus,
            data => {
                const lmi = data.lmi ? data.lmi.toString() : "";
                const lsmi = data.lsmi ? data.lsmi.toString() : "";

                if (lmi !== this.state.lmi) {
                    this.setState({ lmi });
                }

                if (lsmi !== this.state.lsmi) {
                    this.setState({ lsmi });
                }
            });

        this._mpsMetricsSubscription = this._metricsService.subscribe<ITpsMetrics>(
            WebSocketTopic.TPSMetrics,
            undefined,
            allData => {
                const mpsIncoming = allData.map(m => m.incoming);
                const mpsOutgoing = allData.map(m => m.outgoing);

                this.setState({ mpsIncoming, mpsOutgoing });
            }
        );
    }

    /**
     * The component will unmount.
     */
    public componentWillUnmount(): void {
        super.componentWillUnmount();

        if (this._themeSubscriptionId) {
            this._themeService.unsubscribe(this._themeSubscriptionId);
            this._themeSubscriptionId = undefined;
        }

        if (this._statusSubscription) {
            this._metricsService.unsubscribe(this._statusSubscription);
            this._statusSubscription = undefined;
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
                                    <p className="secondary margin-t-t">{this.state.autoPeeringId}</p>
                                </div>
                                <p className="secondary">v{this.state.version}</p>
                            </div>
                            <BannerCurve className="banner-curve" />
                            <div className="banner-image">
                                <img src={this.state.bannerSrc} />
                            </div>
                        </div>
                    </div>
                    <div className="row fill margin-t-s">
                        <div className="col">
                            <div className="row">
                                <InfoPanel
                                    caption="LSMI / LMI"
                                    value={`${this.state.lsmi} / ${this.state.lmi}`}
                                    icon={<MilestoneIcon />}
                                    backgroundStyle="green"
                                    className="margin-r-s"
                                />
                                <InfoPanel
                                    caption="Pruning Index"
                                    value={this.state.pruningIndex?.toString()}
                                    icon={<PruningIcon />}
                                    backgroundStyle="orange"
                                    className="margin-r-s"
                                />
                            </div>
                            <div className="row margin-t-s">
                                <InfoPanel
                                    caption="Uptime"
                                    value={this.state.uptime}
                                    icon={<UptimeIcon />}
                                    backgroundStyle="blue"
                                    className="margin-r-s"
                                />
                                <InfoPanel
                                    caption="Memory Usage"
                                    value={this.state.memory}
                                    icon={<MemoryIcon />}
                                    backgroundStyle="purple"
                                    className="margin-r-s"
                                />
                            </div>
                            <div className="row margin-t-s">
                                <div className="card fill messages-graph-panel margin-r-s">
                                    <Graph
                                        caption="Messages Per Second"
                                        seriesMaxLength={40}
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
                        <div className="card peers-summary-panel">
                            <PeersSummaryPanel />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Home;
