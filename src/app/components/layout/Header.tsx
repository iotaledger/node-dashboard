import React, { Component, ReactNode } from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { IDBSizeMetric } from "../../../models/websocket/IDBSizeMetric";
import { IStatus } from "../../../models/websocket/IStatus";
import { ITpsMetrics } from "../../../models/websocket/ITpsMetrics";
import { WebSocketTopic } from "../../../models/websocket/webSocketTopic";
import { MetricsService } from "../../../services/metricsService";
import { DataHelper } from "../../../utils/dataHelper";
import { FormatHelper } from "../../../utils/formatHelper";
import "./Header.scss";
import { HeaderState } from "./HeaderState";
import HealthIndicator from "./HealthIndicator";
import MicroGraph from "./MicroGraph";
import SearchInput from "./SearchInput";

/**
 * Header panel.
 */
class Header extends Component<RouteComponentProps, HeaderState> {
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
     * Create a new instance of Home.
     * @param props The props.
     */
    constructor(props: RouteComponentProps) {
        super(props);

        this._metricsService = ServiceFactory.get<MetricsService>("metrics");

        this.state = {
            syncHealth: false,
            nodeHealth: false,
            mps: "-",
            mpsValues: [],
            memorySizeFormatted: "-",
            memorySize: [],
            databaseSizeFormatted: "-",
            databaseSize: []
        };
    }

    /**
     * The component mounted.
     */
    public componentDidMount(): void {
        this._statusSubscription = this._metricsService.subscribe<IStatus>(
            WebSocketTopic.Status,
            data => {
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
            },
            dataAll => {
                this.setState({ memorySize: dataAll.map(d => DataHelper.calculateMemoryUsage(d)) });
            });

        this._databaseSizeSubscription = this._metricsService.subscribe<IDBSizeMetric>(
            WebSocketTopic.DBSizeMetric,
            data => {
                const databaseSizeFormatted = FormatHelper.size(data.total);

                if (databaseSizeFormatted !== this.state.databaseSizeFormatted) {
                    this.setState({ databaseSizeFormatted });
                }
            },
            dataAll => {
                const databaseSizeValues = dataAll.map(d => d.total);

                this.setState({ databaseSize: databaseSizeValues });
            });

        this._mpsMetricsSubscription = this._metricsService.subscribe<ITpsMetrics>(
            WebSocketTopic.TPSMetrics, data => {
                const mpsValues = this.state.mpsValues.slice(-40);
                mpsValues.push(data.new);

                const mpsFormatted = mpsValues[mpsValues.length - 1].toString();

                if (mpsFormatted !== this.state.databaseSizeFormatted) {
                    this.setState({ mps: mpsFormatted });
                }
                this.setState({ mpsValues });
            });
    }

    /**
     * The component will unmount.
     */
    public componentWillUnmount(): void {
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
                    <SearchInput
                        compact={true}
                        onSearch={query => this.props.history.push(`/search/${query}`)}
                        className="child child-fill"
                    />
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
                    <MicroGraph
                        label="MPS"
                        value={this.state.mps}
                        values={this.state.mpsValues}
                        className="child"
                    />
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
                </div>
            </header>
        );
    }
}

export default withRouter(Header);
