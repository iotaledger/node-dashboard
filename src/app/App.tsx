import React, { ReactNode } from "react";
import { Redirect, Route, RouteComponentProps, Switch, withRouter } from "react-router-dom";
import { ReactComponent as AnalyticsIcon } from "../assets/analytics.svg";
import { ReactComponent as ExplorerIcon } from "../assets/explorer.svg";
import { ReactComponent as HomeIcon } from "../assets/home.svg";
import { ReactComponent as MoonIcon } from "../assets/moon.svg";
import { ReactComponent as PadlockUnlockedIcon } from "../assets/padlock-unlocked.svg";
import { ReactComponent as PadlockIcon } from "../assets/padlock.svg";
import { ReactComponent as PeersIcon } from "../assets/peers.svg";
import { ReactComponent as PluginsIcon } from "../assets/plugins.svg";
import { ReactComponent as SunIcon } from "../assets/sun.svg";
import { ReactComponent as VisualizerIcon } from "../assets/visualizer.svg";
import { ServiceFactory } from "../factories/serviceFactory";
import { INodeStatus } from "../models/websocket/INodeStatus";
import { IPublicNodeStatus } from "../models/websocket/IPublicNodeStatus";
import { ISyncStatus } from "../models/websocket/ISyncStatus";
import { WebSocketTopic } from "../models/websocket/webSocketTopic";
import { AuthService } from "../services/authService";
import { EventAggregator } from "../services/eventAggregator";
import { MetricsService } from "../services/metricsService";
import { ThemeService } from "../services/themeService";
import { BrandHelper } from "../utils/brandHelper";
import "./App.scss";
import { AppState } from "./AppState";
import AsyncComponent from "./components/layout/AsyncComponent";
import Breakpoint from "./components/layout/Breakpoint";
import Header from "./components/layout/Header";
import HealthIndicator from "./components/layout/HealthIndicator";
import NavMenu from "./components/layout/NavMenu";
import NavPanel from "./components/layout/NavPanel";
import Analytics from "./routes/Analytics";
import { AnalyticsRouteProps } from "./routes/AnalyticsRouteProps";
import Explorer from "./routes/Explorer";
import Address from "./routes/explorer/Address";
import { AddressRouteProps } from "./routes/explorer/AddressRouteProps";
import Message from "./routes/explorer/Message";
import { MessageRouteProps } from "./routes/explorer/MessageRouteProps";
import Milestone from "./routes/explorer/Milestone";
import { MilestoneRouteProps } from "./routes/explorer/MilestoneRouteProps";
import Home from "./routes/Home";
import Login from "./routes/Login";
import Peer from "./routes/Peer";
import { PeerRouteProps } from "./routes/PeerRouteProps";
import Peers from "./routes/Peers";
import Plugins from "./routes/Plugins";
import Search from "./routes/Search";
import { SearchRouteProps } from "./routes/SearchRouteProps";
import Unavailable from "./routes/Unavailable";
import Visualizer from "./routes/Visualizer";

/**
 * Main application class.
 */
class App extends AsyncComponent<RouteComponentProps, AppState> {
    /**
     * The theme service.
     */
    private readonly _themeService: ThemeService;

    /**
     * The auth service.
     */
    private readonly _authService: AuthService;

    /**
     * The metrics service.
     */
    private readonly _metricsService: MetricsService;

    /**
     * The public node status subscription id.
     */
    private _publicNodeStatusSubscription?: string;

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
     * The confirmed milestone index.
     */
    private _cmi?: string;

    /**
     * The time of the last status update.
     */
    private _lastStatus: number;

    /**
     * The status timer.
     */
    private _statusTimer?: NodeJS.Timer;

    /**
     * Create a new instance of App.
     * @param props The props.
     */
    constructor(props: RouteComponentProps) {
        super(props);
        this._themeService = ServiceFactory.get<ThemeService>("theme");
        this._authService = ServiceFactory.get<AuthService>("auth");
        this._metricsService = ServiceFactory.get<MetricsService>("metrics");
        this._lastStatus = 0;

        this.state = {
            isLoggedIn: Boolean(this._authService.isLoggedIn()),
            theme: this._themeService.get(),
            online: false,
            syncHealth: false,
            nodeHealth: false
        };

        this.updateTitle();
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        super.componentDidMount();

        EventAggregator.subscribe("auth-state", "app", isLoggedIn => {
            this.setState({
                isLoggedIn
            });
        });

        EventAggregator.subscribe("theme", "app", theme => {
            this.setState({ theme });
        });

        this._statusSubscription = this._metricsService.subscribe<INodeStatus>(
            WebSocketTopic.NodeStatus,
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
                    const smi = data.cmi ? data.cmi.toString() : "";

                    if (lmi !== this._lmi || smi !== this._cmi) {
                        this._cmi = smi;
                        this._lmi = lmi;
                        this.updateTitle();
                    }
                }
            });

        this._publicNodeStatusSubscription = this._metricsService.subscribe<IPublicNodeStatus>(
            WebSocketTopic.PublicNodeStatus,
            data => {
                if (data) {
                    this._lastStatus = Date.now();
                    if (!this.state.online) {
                        EventAggregator.publish("online", true);
                        this.setState({
                            online: true
                        });
                    }
                    if (data.is_healthy !== this.state.nodeHealth) {
                        this.setState({ nodeHealth: data.is_healthy });
                    }
                    if (data.is_synced !== this.state.syncHealth) {
                        this.setState({ syncHealth: data.is_synced });
                    }
                }
            });

        this._statusTimer = setInterval(() => {
            if (Date.now() - this._lastStatus > 10000 && this.state.online) {
                this.setState({
                    online: false
                });

                EventAggregator.publish("online", false);
            }
        }, 1000);
    }

    /**
     * The component will unmount.
     */
    public componentWillUnmount(): void {
        super.componentWillUnmount();

        EventAggregator.unsubscribe("auth-state", "app");
        EventAggregator.unsubscribe("theme", "app");

        if (this._statusSubscription) {
            this._metricsService.unsubscribe(this._statusSubscription);
            this._statusSubscription = undefined;
        }

        if (this._syncStatusSubscription) {
            this._metricsService.unsubscribe(this._syncStatusSubscription);
            this._syncStatusSubscription = undefined;
        }

        if (this._publicNodeStatusSubscription) {
            this._metricsService.unsubscribe(this._publicNodeStatusSubscription);
            this._publicNodeStatusSubscription = undefined;
        }

        if (this._statusTimer !== undefined) {
            clearInterval(this._statusTimer);
            this._statusTimer = undefined;
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        const sections = [
            {
                label: "Home",
                icon: <HomeIcon />,
                route: "/",
                hidden: !this.state.isLoggedIn
            },
            {
                label: "Analytics",
                icon: <AnalyticsIcon />,
                route: "/analytics",
                hidden: !this.state.isLoggedIn
            },
            {
                label: "Peers",
                icon: <PeersIcon />,
                route: "/peers",
                hidden: !this.state.isLoggedIn
            },
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
                label: "Plugins",
                icon: <PluginsIcon />,
                route: "/plugins",
                hidden: !this.state.isLoggedIn
            },
            {
                label: "Login",
                icon: <PadlockIcon />,
                route: "/login",
                hidden: this.state.isLoggedIn
            },
            {
                label: "Logout",
                icon: <PadlockUnlockedIcon />,
                function: () => this._authService.logout(),
                hidden: !this.state.isLoggedIn
            }
        ];

        const endSections = [
            {
                label: "Light",
                icon: <SunIcon />,
                function: () => this._themeService.apply("light", true),
                hidden: this.state.theme === "light"
            },
            {
                label: "Dark",
                icon: <MoonIcon />,
                function: () => this._themeService.apply("dark", true),
                hidden: this.state.theme === "dark"
            }
        ];

        return (
            <div className="app">
                <Breakpoint size="phone" aboveBelow="above">
                    <NavPanel
                        fullWidth={false}
                        middle={this.state.online ? sections : []}
                        end={this.state.online ? endSections : []}
                    />
                </Breakpoint>
                <div className="col fill">
                    <Header>
                        <Breakpoint size="phone" aboveBelow="below">
                            <NavMenu>
                                <NavPanel
                                    fullWidth={true}
                                    middle={this.state.online ? sections : []}
                                    end={this.state.online ? endSections : []}
                                />
                            </NavMenu>
                        </Breakpoint>
                    </Header>
                    <div className="fill scroll-content">
                        {!this.state.online && (
                            <p className="padding-l">The node is offline or loading.</p>
                        )}
                        {this.state.online && (
                            <React.Fragment>
                                <Breakpoint size="tablet" aboveBelow="below">
                                    <div className="card card__flat row middle health-indicators">
                                        <HealthIndicator
                                            label="Health"
                                            healthy={this.state.nodeHealth}
                                            className="child margin-r-l"
                                        />
                                        <HealthIndicator
                                            label="Sync"
                                            healthy={this.state.syncHealth}
                                            className="child"
                                        />
                                    </div>
                                </Breakpoint>
                                <Switch>
                                    {this.state.isLoggedIn && [
                                        <Route
                                            exact={true}
                                            path="/"
                                            component={() => (<Home />)}
                                            key="home"
                                        />,
                                        <Route
                                            path="/analytics/:section?"
                                            component={(props: AnalyticsRouteProps) => (<Analytics {...props} />)}
                                            key="analytics"
                                        />,
                                        <Route
                                            exact={true}
                                            path="/peers"
                                            component={() => (<Peers />)}
                                            key="peers"
                                        />,
                                        <Route
                                            path="/peers/:id"
                                            component={(props: RouteComponentProps<PeerRouteProps>) =>
                                                (<Peer {...props} />)}
                                            key="peer"
                                        />
                                    ]}
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
                                        component={(props: RouteComponentProps<SearchRouteProps>) =>
                                            (<Search {...props} />)}
                                    />
                                    <Route
                                        path="/explorer/unavailable"
                                        component={(props: RouteComponentProps<never>) => (<Unavailable {...props} />)}
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
                                        path="/explorer/address/:address"
                                        component={(props: RouteComponentProps<AddressRouteProps>) =>
                                            (<Address {...props} />)}
                                    />
                                    <Route
                                        path="/visualizer"
                                        component={(props: RouteComponentProps) => (<Visualizer {...props} />)}
                                    />
                                    <Route
                                        path="/plugins"
                                        component={() => (<Plugins />)}
                                    />
                                    <Route
                                        path="/login"
                                        component={() => (<Login />)}
                                    />
                                    <Route
                                        exact={true}
                                        path="*"
                                        component={() => (<Redirect to="/" />)}
                                    />
                                </Switch>
                            </React.Fragment>
                        )}
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
        if (this._lmi && this._cmi) {
            title += ` ${this._cmi} / ${this._lmi}`;
        }

        document.title = title;
    }
}

export default withRouter(App);
