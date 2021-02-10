import React, { Component, ReactNode } from "react";
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
import { AuthService } from "../services/authService";
import { EventAggregator } from "../services/eventAggregator";
import "./App.scss";
import { AppState } from "./AppState";
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
class App extends Component<RouteComponentProps, AppState> {
    /**
     * The auth service.
     */
    private readonly _authService: AuthService;

    /**
     * Create a new instance of App.
     * @param props The props.
     */
    constructor(props: RouteComponentProps) {
        super(props);
        this._authService = ServiceFactory.get<AuthService>("auth");

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
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        const sections = [
            {
                label: "Home",
                icon: <HomeIcon />,
                route: "/"
            },
            {
                label: "Analytics",
                icon: <AnalyticsIcon />,
                route: "/analytics"
            }
        ];

        if (this.state.isLoggedIn) {
            sections.push({
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
                            <Route
                                exact={true}
                                path="/"
                                component={() => (<Home />)}
                            />
                            <Route
                                path="/analytics/:section?"
                                component={(props: AnalyticsRouteProps) => (<Analytics {...props} />)}
                            />
                            {this.state.isLoggedIn && (
                                <Route
                                    exact={true}
                                    path="/peers"
                                    component={() => (<Peers />)}
                                />
                            )}
                            {this.state.isLoggedIn && (
                                <Route
                                    path="/peers/:id"
                                    component={(props: RouteComponentProps<PeerRouteProps>) => (<Peer {...props} />)}
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
}

export default withRouter(App);
