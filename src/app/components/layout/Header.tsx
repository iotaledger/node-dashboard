import React, { ReactNode } from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { IDatabaseSizesMetrics } from "../../../models/websocket/IDatabaseSizesMetrics";
import { IGossipMetrics } from "../../../models/websocket/IGossipMetrics";
import { INodeInfoExtended } from "../../../models/websocket/INodeInfoExtended";
import { IPublicNodeStatus } from "../../../models/websocket/IPublicNodeStatus";
import { WebSocketTopic } from "../../../models/websocket/webSocketTopic";
import { AuthService } from "../../../services/authService";
import { EventAggregator } from "../../../services/eventAggregator";
import { MetricsService } from "../../../services/metricsService";
import { FormatHelper } from "../../../utils/formatHelper";
import AsyncComponent from "./AsyncComponent";
import Breakpoint from "./Breakpoint";
import "./Header.scss";
import { HeaderProps } from "./HeaderProps";
import { HeaderState } from "./HeaderState";
import HealthIndicator from "./HealthIndicator";
import MicroGraph from "./MicroGraph";

/**
 * Header panel.
 */
class Header extends AsyncComponent<RouteComponentProps & HeaderProps, HeaderState> {
    /**
     * The auth service.
     */
    private readonly _authService: AuthService;

    /**
     * The metrics service.
     */
    private readonly _metricsService: MetricsService;

    /**
     * The node info extended subscription id.
     */
    private _nodeInfoExtendedSubscription?: string;

    /**
     * The public node status subscription id.
     */
    private _publicNodeStatusSubscription?: string;

    /**
     * The database size metrics subscription id.
     */
    private _databaseSizeMetricsSubscription?: string;

    /**
     * The gossip metrics subscription id.
     */
    private _gossipMetricsSubscription?: string;

    /**
     * Create a new instance of Header.
     * @param props The props.
     */
    constructor(props: RouteComponentProps & HeaderProps) {
        super(props);

        this._metricsService = ServiceFactory.get<MetricsService>("metrics");
        this._authService = ServiceFactory.get<AuthService>("auth");

        this.state = {
            isNetworkHealthy: false,
            isNodeHealthy: false,
            bps: "-",
            bpsValues: [],
            memorySizeFormatted: "-",
            memorySize: [],
            dbSizeTotalFormatted: "-",
            dbSizeTotal: [],
            isLoggedIn: Boolean(this._authService.isLoggedIn()),
            online: false
        };
    }

    /**
     * The component mounted.
     */
    public componentDidMount(): void {
        super.componentDidMount();

        EventAggregator.subscribe("auth-state", "header", isLoggedIn => {
            this.setState({
                isLoggedIn
            });
        });

        EventAggregator.subscribe("online", "header", online => {
            if (online !== this.state.online) {
                this.setState({
                    online
                });
            }
        });

        this._publicNodeStatusSubscription = this._metricsService.subscribe<IPublicNodeStatus>(
            WebSocketTopic.PublicNodeStatus,
            data => {
                if (data) {
                    if (!this.state.online) {
                        this.setState({
                            online: true
                        });
                    }
                    if (data.isNodeHealthy !== this.state.isNodeHealthy) {
                        this.setState({ isNodeHealthy: data.isNodeHealthy });
                    }
                    if (data.isNetworkHealthy !== this.state.isNetworkHealthy) {
                        this.setState({ isNetworkHealthy: data.isNetworkHealthy });
                    }
                }
            });

        this._nodeInfoExtendedSubscription = this._metricsService.subscribe<INodeInfoExtended>(
            WebSocketTopic.NodeInfoExtended,
            data => {
                if (data) {
                    const memorySizeFormatted = FormatHelper.iSize(data.memoryUsage, 1);

                    if (memorySizeFormatted !== this.state.memorySizeFormatted) {
                        this.setState({ memorySizeFormatted });
                    }
                }
            },
            allData => {
                const nonNull = allData.filter(d => d !== undefined && d !== null);
                this.setState({
                    memorySize: nonNull
                        .map(d => d.memoryUsage)
                });
            });

        this._databaseSizeMetricsSubscription = this._metricsService.subscribe<IDatabaseSizesMetrics>(
            WebSocketTopic.DatabaseSizeMetric,
            data => {
                if (data) {
                    let dbSizeTotalFormatted = "-";
                    if (data.databaseSizes.length > 0) {
                        dbSizeTotalFormatted = FormatHelper.size(data.databaseSizes[0].total);
                    }

                    if (dbSizeTotalFormatted !== this.state.dbSizeTotalFormatted) {
                        this.setState({ dbSizeTotalFormatted });
                    }
                }
            },
            allData => {
                const nonNull = allData.filter(d => d?.databaseSizes !== undefined && d?.databaseSizes !== null);

                const dbSizeTotalValues = nonNull
                    .map(d => d.databaseSizes.map(s => s.total));

                const dbSizeTotalFlattened = dbSizeTotalValues.flat();

                this.setState({ dbSizeTotal: dbSizeTotalFlattened });
            });

        this._gossipMetricsSubscription = this._metricsService.subscribe<IGossipMetrics>(
            WebSocketTopic.GossipMetrics,
            data => {
                if (data) {
                    const bpsValues = this.state.bpsValues.slice(-40);
                    bpsValues.push(data.new);

                    let bpsFormatted = "-";
                    if (bpsValues.length > 0) {
                        bpsFormatted = bpsValues[bpsValues.length - 1].toString();
                    }

                    if (bpsFormatted !== this.state.bps) {
                        this.setState({ bps: bpsFormatted });
                    }
                    this.setState({ bpsValues });
                }
            });
    }

    /**
     * The component will unmount.
     */
    public componentWillUnmount(): void {
        super.componentWillUnmount();

        EventAggregator.unsubscribe("auth-state", "header");
        EventAggregator.unsubscribe("online", "header");

        if (this._publicNodeStatusSubscription) {
            this._metricsService.unsubscribe(this._publicNodeStatusSubscription);
            this._publicNodeStatusSubscription = undefined;
        }

        if (this._nodeInfoExtendedSubscription) {
            this._metricsService.unsubscribe(this._nodeInfoExtendedSubscription);
            this._nodeInfoExtendedSubscription = undefined;
        }

        if (this._databaseSizeMetricsSubscription) {
            this._metricsService.unsubscribe(this._databaseSizeMetricsSubscription);
            this._databaseSizeMetricsSubscription = undefined;
        }

        if (this._gossipMetricsSubscription) {
            this._metricsService.unsubscribe(this._gossipMetricsSubscription);
            this._gossipMetricsSubscription = undefined;
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <header className="header">
                <div className="content">
                    {this.state.online && (
                        <React.Fragment>
                            {this.props.children}
                            <Breakpoint size="tablet" aboveBelow="above">
                                <HealthIndicator
                                    label="Node Health"
                                    healthy={this.state.isNodeHealthy}
                                    className="child"
                                />
                                <HealthIndicator
                                    label="Network Health"
                                    healthy={this.state.isNetworkHealthy}
                                    className="child"
                                />
                            </Breakpoint>
                            <Breakpoint size="desktop" aboveBelow="above">
                                <MicroGraph
                                    label="Blocks Per Second"
                                    value={this.state.bps}
                                    values={this.state.bpsValues}
                                    className="child"
                                />
                                {this.state.isLoggedIn && (
                                    <React.Fragment>
                                        <MicroGraph
                                            label="Database Size"
                                            value={this.state.dbSizeTotalFormatted}
                                            values={this.state.dbSizeTotal}
                                            className="child"
                                        />
                                        <MicroGraph
                                            label="Memory Usage"
                                            value={this.state.memorySizeFormatted}
                                            values={this.state.memorySize}
                                            className="child"
                                        />
                                    </React.Fragment>
                                )}
                            </Breakpoint>
                        </React.Fragment>
                    )}
                </div>
            </header>
        );
    }
}

export default withRouter(Header);
