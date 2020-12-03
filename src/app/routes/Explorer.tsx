import React, { ReactNode } from "react";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";
import { ReactComponent as ConfirmationIcon } from "../../assets/confirmation.svg";
import { ReactComponent as MilestoneIcon } from "../../assets/milestone.svg";
import { ReactComponent as PruningIcon } from "../../assets/pruning.svg";
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
            mps: "-",
            cmps: "-",
            confirmationRate: "-"
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
                this.setState({
                    milestones: allData
                        .map(m => ({ index: m.index, messageId: m.messageID }))
                        .sort((m1, m2) => m2.index - m1.index)
                        .slice(0, 10)
                });
            }
        );

        this._confirmedMsMetricsSubscription = this._metricsService.subscribe<IConfirmedMsMetrics>(
            WebSocketTopic.ConfirmedMsMetrics,
            data => {
                this.setState({
                    mps: data.mps.toFixed(1).toString(),
                    cmps: data.cmps.toFixed(1).toString(),
                    confirmationRate: `${data.referenced_rate.toFixed(1).toString()}%`
                });
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
                    <div className="row info margin-t-s">
                        <InfoPanel
                            caption="Messages per Second"
                            value={this.state.mps}
                            icon={<MilestoneIcon />}
                            backgroundStyle="green"
                            className="margin-r-s"
                        />
                        <InfoPanel
                            caption="Confirmed Messages per Second"
                            value={this.state.cmps}
                            icon={<PruningIcon />}
                            backgroundStyle="orange"
                            className="margin-r-s"
                        />
                        <InfoPanel
                            caption="Confirmation Rate"
                            value={this.state.confirmationRate}
                            icon={<ConfirmationIcon />}
                            backgroundStyle="purple"
                        />
                    </div>
                    <div className="card milestones-panel margin-t-s">
                        <h4 className="margin-b-l">Latest Milestones</h4>
                        {this.state.milestones.map((ms, idx) => (
                            <div key={idx} className="milestones-panel--milestone">
                                <div className="index">{ms.index}</div>
                                <Link
                                    to={`/explorer/message/${ms.messageId}`}
                                >
                                    {ms.messageId}
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
