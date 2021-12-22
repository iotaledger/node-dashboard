import React, { ReactNode } from "react";
import { ServiceFactory } from "../../factories/serviceFactory";
import { AuthService } from "../../services/authService";
import AsyncComponent from "../components/layout/AsyncComponent";
import TabPanel from "../components/layout/TabPanel";
import Participation from "../components/plugins/Participation";
import Spammer from "../components/plugins/Spammer";
import "./Plugins.scss";
import { PluginsState } from "./PluginsState";

/**
 * Plugins panel.
 */
class Plugins extends AsyncComponent<unknown, PluginsState> {
    /**
     * The auth service.
     */
    private readonly _authService: AuthService;

    /**
     * Create a new instance of Plugins.
     * @param props The props.
     */
    constructor(props: unknown) {
        super(props);

        this._authService = ServiceFactory.get<AuthService>("auth");

        this.state = {
            plugins: []
        };
    }

    /**
     * The component did mount.
     */
    public async componentDidMount(): Promise<void> {
        super.componentDidMount();

        const plugins = [];

        if (this._authService.isLoggedIn()) {
            const pluginDetailsSpammer = Spammer.pluginDetails();
            if (pluginDetailsSpammer) {
                plugins.push(pluginDetailsSpammer);
            }
            const pluginDetailsParticipation = Participation.pluginDetails();
            if (pluginDetailsParticipation) {
                plugins.push(pluginDetailsParticipation);
            }
        }

        if (plugins.length > 0) {
            this.setState({
                activeTab: plugins[0].title
            });
        }

        this.setState({
            plugins
        });
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="plugins">
                <div className="content">
                    {this.state.plugins.length === 0 && (
                        <p className="margin-t-s">
                            No plugins supported by the dashboard are enabled.<br />
                            More information about managing plugins can be found on the
                            {" "}
                            <a
                                target="_blank"
                                rel="noreferrer"
                                href="https://wiki.iota.org/hornet/post_installation/managing_a_node#plugins"
                            >
                                Hornet Developer Documentation.
                            </a>
                        </p>
                    )}
                    <TabPanel
                        tabs={this.state.plugins.map(p => p.title)}
                        activeTab={this.state.activeTab ? this.state.activeTab : ""}
                        onTabChanged={activeTab => {
                            this.setState({
                                activeTab
                            });
                        }}
                    >
                        {this.state.plugins.map((p, idx) => (
                            <div data-label={p.title} key={idx}>
                                {p.settings}
                            </div>
                        ))}

                    </TabPanel>
                </div>
            </div >
        );
    }
}

export default Plugins;
