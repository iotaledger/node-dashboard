import React, { ReactNode } from "react";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";
import { ReactComponent as ConfirmationIcon } from "../../assets/confirmation.svg";
import { ReactComponent as MilestoneIcon } from "../../assets/milestone.svg";
import { ReactComponent as UptimeIcon } from "../../assets/uptime.svg";
import { ServiceFactory } from "../../factories/serviceFactory";
import { IConfirmedMsMetrics } from "../../models/websocket/IConfirmedMsMetrics";
import { IMs } from "../../models/websocket/IMs";
import { WebSocketTopic } from "../../models/websocket/webSocketTopic";
import { MetricsService } from "../../services/metricsService";
import AsyncComponent from "../components/layout/AsyncComponent";
import InfoPanel from "../components/layout/InfoPanel";
import SearchInput from "../components/layout/SearchInput";
import "./Explorer.scss";
import { ExplorerState } from "./ExplorerState";

/**
 * Explorer panel.
 */
class Peers extends AsyncComponent<RouteComponentProps, ExplorerState> {
    /**
     * The metrics service.
     */
    private readonly _metricsService: MetricsService;

    /**
     * The milestones subscription id.
     */
    private _milestonesSubscription?: string;

    /**
     * The confirmed metrics subscription id.
     */
    private _confirmedMsMetricsSubscription?: string;

    /**
     * Create a new instance of Peers.
     * @param props The props.
     */
    constructor(props: RouteComponentProps) {
        super(props);

        this._metricsService = ServiceFactory.get<MetricsService>("metrics");

        this.state = {
            milestones: [],
            bps: "-",
            rbps: "-",
            referencedRate: "-"
        };
    }

    /**
     * The component mounted.
     */
    public componentDidMount(): void {
        super.componentDidMount();

        this._milestonesSubscription = this._metricsService.subscribe<IMs>(
            WebSocketTopic.Ms,
            undefined,
            allData => {
                const nonNull = allData.filter(d => d !== undefined && d !== null);

                this.setState({
                    milestones: nonNull
                        .map(m => ({ index: m.index, milestoneId: m.milestoneId }))
                        .sort((m1, m2) => m2.index - m1.index)
                        .slice(0, 10)
                });
            }
        );

        this._confirmedMsMetricsSubscription = this._metricsService.subscribe<IConfirmedMsMetrics>(
            WebSocketTopic.ConfirmedMsMetrics,
            data => {
                if (data) {
                    this.setState({
                        bps: data.bps.toFixed(1).toString(),
                        rbps: data.rbps.toFixed(1).toString(),
                        referencedRate: `${data.referenced_rate.toFixed(1).toString()}%`
                    });
                }
            }
        );
    }

    /**
     * The component will unmount.
     */
    public componentWillUnmount(): void {
        super.componentWillUnmount();

        if (this._milestonesSubscription) {
            this._metricsService.unsubscribe(this._milestonesSubscription);
            this._milestonesSubscription = undefined;
        }

        if (this._confirmedMsMetricsSubscription) {
            this._metricsService.unsubscribe(this._confirmedMsMetricsSubscription);
            this._confirmedMsMetricsSubscription = undefined;
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="explorer">
                <div className="content">
                    <h2>Explorer</h2>
                    <div className="card search-panel">
                        <SearchInput
                            compact={false}
                            onSearch={query => this.props.history.push(`/explorer/search/${query}`)}
                        />
                    </div>
                    <div className="row tablet-down-column info margin-t-s">
                        <InfoPanel
                            caption="Blocks per Second"
                            value={this.state.bps}
                            icon={<MilestoneIcon />}
                            backgroundStyle="green"
                        />
                        <InfoPanel
                            caption="Referenced Blocks per Second"
                            value={this.state.rbps}
                            icon={<UptimeIcon />}
                            backgroundStyle="blue"
                        />
                        <InfoPanel
                            caption="Referenced Rate"
                            value={this.state.referencedRate}
                            icon={<ConfirmationIcon />}
                            backgroundStyle="purple"
                        />
                    </div>
                    <div className="card milestones-panel margin-t-s">
                        <h4 className="margin-b-l">Latest Milestones</h4>
                        {this.state.milestones.length === 0 && (
                            <p className="margin-t-s">There are no milestones.</p>
                        )}

                        {this.state.milestones.map((ms, idx) => (
                            <div key={idx} className="milestones-panel--milestone">
                                <div className="index">{ms.index}</div>
                                <Link
                                    to={`/explorer/milestone/${ms.index}`}
                                >
                                    {ms.milestoneId}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(Peers);
