import React, { ReactNode } from "react";
import { Redirect, Route, RouteComponentProps, Switch, withRouter } from "react-router-dom";
import { ReactComponent as AnalyticsIcon } from "../assets/analytics.svg";
import { ReactComponent as ExplorerIcon } from "../assets/explorer.svg";
import { ReactComponent as HomeIcon } from "../assets/home.svg";
import { ReactComponent as PadlockUnlockedIcon } from "../assets/padlock-unlocked.svg";
import { ReactComponent as PadlockIcon } from "../assets/padlock.svg";
import { ReactComponent as PeersIcon } from "../assets/peers.svg";
import { ReactComponent as SettingsIcon } from "../assets/settings.svg";
import { ReactComponent as VisualizerIcon } from "../assets/visualizer.svg";
import { ServiceFactory } from "../factories/serviceFactory";
import { IStatus } from "../models/websocket/IStatus";
import { ISyncStatus } from "../models/websocket/ISyncStatus";
import { WebSocketTopic } from "../models/websocket/webSocketTopic";
import { AuthService } from "../services/authService";
import { EventAggregator } from "../services/eventAggregator";
import { MetricsService } from "../services/metricsService";
import { BrandHelper } from "../utils/brandHelper";
import "./App.scss";
import { AppState } from "./AppState";
import AsyncComponent from "./components/layout/AsyncComponent";
import Header from "./components/layout/Header";
import NavPanel from "./components/layout/NavPanel";
import Analytics from "./routes/Analytics";
import { AnalyticsRouteProps } from "./routes/AnalyticsRouteProps";
import Explorer from "./routes/Explorer";
import Address from "./routes/explorer/Address";
import { AddressRouteProps } from "./routes/explorer/AddressRouteProps";
import Indexed from "./routes/explorer/Indexed";
import { IndexedRouteProps } from "./routes/explorer/IndexedRouteProps";
import Message from "./routes/explorer/Message";
import { MessageRouteProps } from "./routes/explorer/MessageRouteProps";
import Milestone from "./routes/explorer/Milestone";
import { MilestoneRouteProps } from "./routes/explorer/MilestoneRouteProps";
import Home from "./routes/Home";
import Login from "./routes/Login";
import Logout from "./routes/Logout";
import Peer from "./routes/Peer";
import { PeerRouteProps } from "./routes/PeerRouteProps";
import Peers from "./routes/Peers";
import Search from "./routes/Search";
import { SearchRouteProps } from "./routes/SearchRouteProps";
import Settings from "./routes/Settings";
import Visualizer from "./routes/Visualizer";

/**
 * Main application class.
 */
class App extends AsyncComponent<RouteComponentProps, AppState> {
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
     * The sync status metrics subscription id.
     */
    private _syncStatusSubscription?: string;

    /**
     * The node alias.
     */
    private _alias?: string;

    /**
     * The lastest milestone index.
     */
    private _lmi?: string;

    /**
     * The lastest solid milestone index.
     */
    private _lsmi?: string;

    /**
     * Create a new instance of App.
     * @param props The props.
     */
    constructor(props: RouteComponentProps) {
        super(props);
        this._authService = ServiceFactory.get<AuthService>("auth");
        this._metricsService = ServiceFactory.get<MetricsService>("metrics");

        this.state = {
            isLoggedIn: this._authService.isLoggedIn() !== undefined
        };

        EventAggregator.subscribe("auth-state", "app", isLoggedIn => {
            this.setState({
                isLoggedIn
            });
        });
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        super.componentDidMount();

        this._statusSubscription = this._metricsService.subscribe<IStatus>(
            WebSocketTopic.Status,
            data => {
                if (data && data.node_alias !== this._alias) {
                    this._alias = data.node_alias;
                    this.updateTitle();
                }
            });

        this._syncStatusSubscription = this._metricsService.subscribe<ISyncStatus>(
            WebSocketTopic.SyncStatus,
            data => {
                if (data) {
                    const lmi = data.lmi ? data.lmi.toString() : "";
                    const lsmi = data.lsmi ? data.lsmi.toString() : "";

                    if (lmi !== this._lmi || lsmi !== this._lsmi) {
                        this._lsmi = lsmi;
                        this._lmi = lmi;
                        this.updateTitle();
                    }
                }
            });
    }

    /**
     * The component will unmount.
     */
    public componentWillUnmount(): void {
        super.componentWillUnmount();

        if (this._statusSubscription) {
            this._metricsService.unsubscribe(this._statusSubscription);
            this._statusSubscription = undefined;
        }

        if (this._syncStatusSubscription) {
            this._metricsService.unsubscribe(this._syncStatusSubscription);
            this._syncStatusSubscription = undefined;
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        const sections = [];

        if (this.state.isLoggedIn) {
            sections.push(
                {
                    label: "Home",
                    icon: <HomeIcon />,
                    route: "/"
                },
                {
                    label: "Analytics",
                    icon: <AnalyticsIcon />,
                    route: "/analytics"
                },
                {
                    label: "Peers",
                    icon: <PeersIcon />,
                    route: "/peers"
                });
        }
        sections.push(
            {
                label: "Explorer",
                icon: <ExplorerIcon />,
                route: "/explorer"
            },
            {
                label: "Visualizer",
                icon: <VisualizerIcon />,
                route: "/visualizer"
            },
            {
                label: "Settings",
                icon: <SettingsIcon />,
                route: "/settings"
            },
            {
                label: this.state.isLoggedIn ? "Logout" : "Login",
                icon: this.state.isLoggedIn ? <PadlockUnlockedIcon /> : <PadlockIcon />,
                route: this.state.isLoggedIn ? "/logout" : "/login"
            }
        );

        return (
            <div className="app">
                <NavPanel buttons={sections} />
                <div className="col fill">
                    <Header />
                    <div className="fill scroll-content">
                        <Switch>
                            {this.state.isLoggedIn && (
                                <React.Fragment>
                                    <Route
                                        exact={true}
                                        path="/"
                                        component={() => (<Home />)}
                                    />
                                    <Route
                                        path="/analytics/:section?"
                                        component={(props: AnalyticsRouteProps) => (<Analytics {...props} />)}
                                    />
                                    <Route
                                        exact={true}
                                        path="/peers"
                                        component={() => (<Peers />)}
                                    />
                                    <Route
                                        path="/peers/:id"
                                        component={(props: RouteComponentProps<PeerRouteProps>) =>
                                            (<Peer {...props} />)}
                                    />
                                </React.Fragment>
                            )}
                            {!this.state.isLoggedIn && (
                                <Route
                                    path="/"
                                    exact={true}
                                    component={() => (<Explorer />)}
                                />
                            )}
                            <Route
                                path="/explorer"
                                exact={true}
                                component={() => (<Explorer />)}
                            />
                            <Route
                                path="/explorer/search/:query?"
                                component={(props: RouteComponentProps<SearchRouteProps>) => (<Search {...props} />)}
                            />
                            <Route
                                path="/explorer/message/:messageId"
                                component={(props: RouteComponentProps<MessageRouteProps>) =>
                                    (<Message {...props} />)}
                            />
                            <Route
                                path="/explorer/milestone/:milestoneIndex"
                                component={(props: RouteComponentProps<MilestoneRouteProps>) =>
                                    (<Milestone {...props} />)}
                            />
                            <Route
                                path="/explorer/indexed/:index"
                                component={(props: RouteComponentProps<IndexedRouteProps>) =>
                                    (<Indexed {...props} />)}
                            />
                            <Route
                                path="/explorer/address/:address"
                                component={(props: RouteComponentProps<AddressRouteProps>) =>
                                    (<Address {...props} />)}
                            />
                            <Route
                                path="/visualizer"
                                component={(props: RouteComponentProps) => (<Visualizer {...props} />)}
                            />
                            <Route
                                path="/settings"
                                component={() => (<Settings />)}
                            />
                            <Route
                                path="/login"
                                component={() => (<Login />)}
                            />
                            <Route
                                path="/logout"
                                component={() => (<Logout />)}
                            />
                            <Route
                                exact={true}
                                path="*"
                                component={() => (<Redirect to="/" />)}
                            />
                        </Switch>
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Update the window title.
     */
    private updateTitle(): void {
        let title = BrandHelper.getConfiguration().name;

        if (this._alias) {
            title += ` (${this._alias})`;
        }
        if (this._lmi && this._lsmi) {
            title += ` ${this._lsmi} / ${this._lmi}`;
        }

        document.title = title;
    }
}

export default withRouter(App);
