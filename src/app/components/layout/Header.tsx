import React, { ReactNode } from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { IBpsMetrics } from "../../../models/websocket/IBpsMetrics";
import { IDBSizeMetric } from "../../../models/websocket/IDBSizeMetric";
import { INodeStatus } from "../../../models/websocket/INodeStatus";
import { IPublicNodeStatus } from "../../../models/websocket/IPublicNodeStatus";
import { WebSocketTopic } from "../../../models/websocket/webSocketTopic";
import { AuthService } from "../../../services/authService";
import { EventAggregator } from "../../../services/eventAggregator";
import { MetricsService } from "../../../services/metricsService";
import { DataHelper } from "../../../utils/dataHelper";
import { FormatHelper } from "../../../utils/formatHelper";
import AsyncComponent from "./AsyncComponent";
import Breakpoint from "./Breakpoint";
import "./Header.scss";
import { HeaderProps } from "./HeaderProps";
import { HeaderState } from "./HeaderState";
import HealthIndicator from "./HealthIndicator";
import MicroGraph from "./MicroGraph";
import SearchInput from "./SearchInput";

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
     * The node status subscription id.
     */
    private _nodeStatusSubscription?: string;

    /**
     * The public node status subscription id.
     */
    private _publicNodeStatusSubscription?: string;

    /**
     * The database size metrics subscription id.
     */
    private _databaseSizeSubscription?: string;

    /**
     * The bps metrics subscription id.
     */
    private _bpsMetricsSubscription?: string;

    /**
     * Create a new instance of Header.
     * @param props The props.
     */
    constructor(props: RouteComponentProps & HeaderProps) {
        super(props);

        this._metricsService = ServiceFactory.get<MetricsService>("metrics");
        this._authService = ServiceFactory.get<AuthService>("auth");

        this.state = {
            syncHealth: false,
            nodeHealth: false,
            bps: "-",
            bpsValues: [],
            memorySizeFormatted: "-",
            memorySize: [],
            databaseSizeFormatted: "-",
            databaseSize: [],
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
                    if (data.isHealthy !== this.state.nodeHealth) {
                        this.setState({ nodeHealth: data.isHealthy });
                    }
                    if (data.isSynced !== this.state.syncHealth) {
                        this.setState({ syncHealth: data.isSynced });
                    }
                }
            });

        this._nodeStatusSubscription = this._metricsService.subscribe<INodeStatus>(
            WebSocketTopic.NodeStatus,
            data => {
                if (data) {
                    const memorySizeFormatted = FormatHelper.iSize(DataHelper.calculateMemoryUsage(data), 1);

                    if (memorySizeFormatted !== this.state.memorySizeFormatted) {
                        this.setState({ memorySizeFormatted });
                    }
                }
            },
            allData => {
                const nonNull = allData.filter(d => d !== undefined && d !== null);
                this.setState({
                    memorySize: nonNull
                        .map(d => DataHelper.calculateMemoryUsage(d))
                });
            });

        this._databaseSizeSubscription = this._metricsService.subscribe<IDBSizeMetric>(
            WebSocketTopic.DBSizeMetric,
            data => {
                if (data) {
                    const databaseSizeFormatted = FormatHelper.size(data.total);

                    if (databaseSizeFormatted !== this.state.databaseSizeFormatted) {
                        this.setState({ databaseSizeFormatted });
                    }
                }
            },
            allData => {
                const nonNull = allData.filter(d => d !== undefined && d !== null);

                const databaseSizeValues = nonNull
                    .map(d => d.total);

                this.setState({ databaseSize: databaseSizeValues });
            });

        this._bpsMetricsSubscription = this._metricsService.subscribe<IBpsMetrics>(
            WebSocketTopic.BPSMetrics,
            data => {
                if (data) {
                    const bpsValues = this.state.bpsValues.slice(-40);
                    bpsValues.push(data.new);

                    const bpsFormatted = bpsValues[bpsValues.length - 1].toString();

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

        if (this._nodeStatusSubscription) {
            this._metricsService.unsubscribe(this._nodeStatusSubscription);
            this._nodeStatusSubscription = undefined;
        }

        if (this._databaseSizeSubscription) {
            this._metricsService.unsubscribe(this._databaseSizeSubscription);
            this._databaseSizeSubscription = undefined;
        }

        if (this._bpsMetricsSubscription) {
            this._metricsService.unsubscribe(this._bpsMetricsSubscription);
            this._bpsMetricsSubscription = undefined;
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
                            <SearchInput
                                compact={true}
                                onSearch={query => this.props.history.push(`/explorer/search/${query}`)}
                                className="child child-fill"
                            />
                            <Breakpoint size="tablet" aboveBelow="above">
                                <HealthIndicator
                                    label="Health"
                                    healthy={this.state.nodeHealth}
                                    className="child"
                                />
                                <HealthIndicator
                                    label="Sync"
                                    healthy={this.state.syncHealth}
                                    className="child"
                                />
                            </Breakpoint>
                            <Breakpoint size="desktop" aboveBelow="above">
                                <MicroGraph
                                    label="BPS"
                                    value={this.state.bps}
                                    values={this.state.bpsValues}
                                    className="child"
                                />
                                {this.state.isLoggedIn && (
                                    <React.Fragment>
                                        <MicroGraph
                                            label="Database"
                                            value={this.state.databaseSizeFormatted}
                                            values={this.state.databaseSize}
                                            className="child"
                                        />
                                        <MicroGraph
                                            label="Memory"
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
