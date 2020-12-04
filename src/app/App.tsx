import React, { Component, ReactNode } from "react";
import { Route, RouteComponentProps, Switch, withRouter } from "react-router-dom";
import { ReactComponent as AnalyticsIcon } from "../assets/analytics.svg";
import { ReactComponent as ExplorerIcon } from "../assets/explorer.svg";
import { ReactComponent as HomeIcon } from "../assets/home.svg";
import { ReactComponent as PeersIcon } from "../assets/peers.svg";
import { ReactComponent as SettingsIcon } from "../assets/settings.svg";
import { ReactComponent as VisualizerIcon } from "../assets/visualizer.svg";
import "./App.scss";
import Header from "./components/layout/Header";
import NavPanel from "./components/layout/NavPanel";
import Analytics from "./routes/Analytics";
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
import Peers from "./routes/Peers";
import Search from "./routes/Search";
import { SearchRouteProps } from "./routes/SearchRouteProps";
import Settings from "./routes/Settings";
import Visualizer from "./routes/Visualizer";

/**
 * Main application class.
 */
class App extends Component<RouteComponentProps> {
    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="app">
                <NavPanel buttons={[
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
                        label: "Settings",
                        icon: <SettingsIcon />,
                        route: "/settings"
                    }
                ]}
                />
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
                                path="/analytics"
                                component={() => (<Analytics />)}
                            />
                            <Route
                                path="/peers"
                                component={() => (<Peers />)}
                            />
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
                        </Switch>
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(App);
