import React, { ReactNode } from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { IDBSizeMetric } from "../../../models/websocket/IDBSizeMetric";
import { IMpsMetrics } from "../../../models/websocket/IMpsMetrics";
import { IStatus } from "../../../models/websocket/IStatus";
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
     * The status subscription id.
     */
    private _statusSubscription?: string;

    /**
     * The database size metrics subscription id.
     */
    private _databaseSizeSubscription?: string;

    /**
     * The mps metrics subscription id.
     */
    private _mpsMetricsSubscription?: string;

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
            mps: "-",
            mpsValues: [],
            memorySizeFormatted: "-",
            memorySize: [],
            databaseSizeFormatted: "-",
            databaseSize: [],
            isLoggedIn: Boolean(this._authService.isLoggedIn())
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

        this._statusSubscription = this._metricsService.subscribe<IStatus>(
            WebSocketTopic.Status,
            data => {
                if (data) {
                    const memorySizeFormatted = FormatHelper.size(DataHelper.calculateMemoryUsage(data), 1);

                    if (memorySizeFormatted !== this.state.memorySizeFormatted) {
                        this.setState({ memorySizeFormatted });
                    }
                    if (data.is_healthy !== this.state.nodeHealth) {
                        this.setState({ nodeHealth: data.is_healthy });
                    }
                    if (data.is_synced !== this.state.syncHealth) {
                        this.setState({ syncHealth: data.is_synced });
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

        this._mpsMetricsSubscription = this._metricsService.subscribe<IMpsMetrics>(
            WebSocketTopic.MPSMetrics,
            data => {
                if (data) {
                    const mpsValues = this.state.mpsValues.slice(-40);
                    mpsValues.push(data.new);

                    const mpsFormatted = mpsValues[mpsValues.length - 1].toString();

                    if (mpsFormatted !== this.state.mps) {
                        this.setState({ mps: mpsFormatted });
                    }
                    this.setState({ mpsValues });
                }
            });
    }

    /**
     * The component will unmount.
     */
    public componentWillUnmount(): void {
        super.componentWillUnmount();

        EventAggregator.unsubscribe("auth-state", "header");

        if (this._statusSubscription) {
            this._metricsService.unsubscribe(this._statusSubscription);
            this._statusSubscription = undefined;
        }

        if (this._databaseSizeSubscription) {
            this._metricsService.unsubscribe(this._databaseSizeSubscription);
            this._databaseSizeSubscription = undefined;
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
            <header className="header">
                <div className="content">
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
                            label="MPS"
                            value={this.state.mps}
                            values={this.state.mpsValues}
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
                </div>
            </header>
        );
    }
}

export default withRouter(Header);
