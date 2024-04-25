import moment from "moment";
import React, { ReactNode } from "react";
import { Redirect, Route, RouteComponentProps, Switch, withRouter } from "react-router-dom";
import { ReactComponent as HomeIcon } from "../assets/home.svg";
import { ReactComponent as MoonIcon } from "../assets/moon.svg";
import { ReactComponent as PadlockUnlockedIcon } from "../assets/padlock-unlocked.svg";
import { ReactComponent as PadlockIcon } from "../assets/padlock.svg";
import { ReactComponent as PeersIcon } from "../assets/peers.svg";
import { ReactComponent as SunIcon } from "../assets/sun.svg";
import { ReactComponent as VisualizerIcon } from "../assets/visualizer.svg";
import { ServiceFactory } from "../factories/serviceFactory";
import { INodeInfoExtended } from "../models/websocket/INodeInfoExtended";
import { IPublicNodeStatus } from "../models/websocket/IPublicNodeStatus";
import { ISyncStatus } from "../models/websocket/ISyncStatus";
import { WebSocketTopic } from "../models/websocket/webSocketTopic";
import { AuthService } from "../services/authService";
import { DashboardConfigService } from "../services/dashboardConfigService";
import { EventAggregator } from "../services/eventAggregator";
import { LocalStorageService } from "../services/localStorageService";
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
import Home from "./routes/Home";
import Login from "./routes/Login";
import Peer from "./routes/Peer";
import { PeerRouteProps } from "./routes/PeerRouteProps";
import Peers from "./routes/Peers";
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
     * The storage service.
     */
    private readonly _storageService: LocalStorageService;

    /**
     * The dashboard config service.
     */
    private readonly _dashboardConfigService: DashboardConfigService;

    /**
     * The metrics service.
     */
    private readonly _metricsService: MetricsService;

    /**
     * The public node status subscription id.
     */
    private _publicNodeStatusSubscription?: string;

    /**
     * The node info extended subscription id.
     */
    private _nodeInfoExtendedSubscription?: string;

    /**
     * The sync status metrics subscription id.
     */
    private _syncStatusSubscription?: string;

    /**
     * The node alias.
     */
    private _alias?: string;

    /**
     * The lastest committed slot.
     */
    private _latestCommitmentSlot?: string;

    /**
     * The latest finalized slot.
     */
    private _latestFinalizedSlot?: string;

    /**
     * The time of the last status update.
     */
    private _lastStatus: number;

    /**
     * The status timer.
     */
    private _statusTimer?: NodeJS.Timer;

    /**
     * The token expiry timer.
     */
    private _tokenExpiryTimer?: NodeJS.Timer;

    /**
     * Create a new instance of App.
     * @param props The props.
     */
    constructor(props: RouteComponentProps) {
        super(props);
        this._themeService = ServiceFactory.get<ThemeService>("theme");
        this._authService = ServiceFactory.get<AuthService>("auth");
        this._dashboardConfigService = ServiceFactory.get<DashboardConfigService>("dashboard-config");
        this._metricsService = ServiceFactory.get<MetricsService>("metrics");
        this._storageService = ServiceFactory.get<LocalStorageService>("local-storage");

        this._lastStatus = 0;

        this.state = {
            isLoggedIn: Boolean(this._authService.isLoggedIn()),
            theme: this._themeService.get(),
            online: false,
            isNetworkHealthy: false,
            isNodeHealthy: false
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
            }, () => {
                if (this.state.isLoggedIn) {
                    this.validateTokenPeriodically();
                }
            });
        });

        EventAggregator.subscribe("theme", "app", theme => {
            this.setState({ theme });
        });

        this._nodeInfoExtendedSubscription = this._metricsService.subscribe<INodeInfoExtended>(
            WebSocketTopic.NodeInfoExtended,
            data => {
                if (data && data.nodeAlias !== this._alias) {
                    this._alias = data.nodeAlias;
                    this.updateTitle();
                }
            });

        this._syncStatusSubscription = this._metricsService.subscribe<ISyncStatus>(
            WebSocketTopic.SyncStatus,
            data => {
                if (data) {
                    const latestCommitmentSlot = data.latestCommitmentSlot ? data.latestCommitmentSlot.toString() : "";
                    const latestFinalizedSlot = data.latestFinalizedSlot ? data.latestFinalizedSlot.toString() : "";

                    if (latestCommitmentSlot !== this._latestCommitmentSlot || latestFinalizedSlot !== this._latestFinalizedSlot) {
                        this._latestCommitmentSlot = latestCommitmentSlot;
                        this._latestFinalizedSlot = latestFinalizedSlot;
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
                    if (data.isNodeHealthy !== this.state.isNodeHealthy) {
                        this.setState({ isNodeHealthy: data.isNodeHealthy });
                    }
                    if (data.isNetworkHealthy !== this.state.isNetworkHealthy) {
                        this.setState({ isNetworkHealthy: data.isNetworkHealthy });
                    }
                }
            });

        this._statusTimer = setInterval(() => {
            if (Date.now() - this._lastStatus > 30000 && this.state.online) {
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

        if (this._nodeInfoExtendedSubscription) {
            this._metricsService.unsubscribe(this._nodeInfoExtendedSubscription);
            this._nodeInfoExtendedSubscription = undefined;
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

        this.clearTokenExpiryInterval();
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
                label: "Peers",
                icon: <PeersIcon />,
                route: "/peers",
                hidden: !this.state.isLoggedIn
            },
            {
                label: "Visualizer",
                icon: <VisualizerIcon />,
                route: "/visualizer"
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
                                            label="Node Health"
                                            healthy={this.state.isNodeHealthy}
                                            className="child margin-r-l"
                                        />
                                        <HealthIndicator
                                            label="Network Health"
                                            healthy={this.state.isNetworkHealthy}
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
                                            component={(props: RouteComponentProps) => (<Visualizer {...props} />)}
                                        />
                                    )}
                                    <Route
                                        path="/visualizer"
                                        component={(props: RouteComponentProps) => (<Visualizer {...props} />)}
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
        if (this._latestCommitmentSlot && this._latestFinalizedSlot) {
            title += ` ${this._latestFinalizedSlot} / ${this._latestCommitmentSlot}`;
        }

        document.title = title;
    }

    /**
     * Refresh the token one minute before it expires.
     */
    private validateTokenPeriodically() {
        this.clearTokenExpiryInterval();
        const jwt = this._storageService.load<string>("dashboard-jwt");
        const expiryTimestamp = this.getTokenExpiry(jwt);
        const expiryDate = moment(expiryTimestamp);
        const refreshTokenDate = moment(expiryDate).subtract(1, "minutes");

        this._tokenExpiryTimer = setInterval(async () => {
            const now = moment();
            if (now.isAfter(expiryDate)) {
                this._authService.logout();
                this.clearTokenExpiryInterval();
            } else if (now.isBetween(refreshTokenDate, expiryDate)) {
                await this._authService.initialize();
            }
        }, 5000);
    }

    /**
     * Decode jwt to get expiry time.
     * @param token The jwt.
     * @returns The expiry time.
     */
    private getTokenExpiry(token: string) {
        const payload = token.split(".")[1];
        const decodedToken = window.atob(payload);
        const parsedToken = JSON.parse(decodedToken);
        const expiryTimestamp = parsedToken.exp * 1000;

        return expiryTimestamp;
    }

    /**
     * Clear token expiry interval.
     */
    private clearTokenExpiryInterval() {
        if (this._tokenExpiryTimer !== undefined) {
            clearInterval(this._tokenExpiryTimer);
            this._tokenExpiryTimer = undefined;
        }
    }
}

export default withRouter(App);
