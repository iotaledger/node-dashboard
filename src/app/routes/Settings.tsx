import React, { ReactNode } from "react";
import { ReactComponent as ChevronDownIcon } from "../../assets/chevron-down.svg";
import { ReactComponent as EllipsisIcon } from "../../assets/ellipsis.svg";
import { ServiceFactory } from "../../factories/serviceFactory";
import { AuthService } from "../../services/authService";
import { ThemeService } from "../../services/themeService";
import AsyncComponent from "../components/layout/AsyncComponent";
import TabPanel from "../components/layout/TabPanel";
import Spammer from "../components/plugins/Spammer";
import "./Settings.scss";
import { SettingsState } from "./SettingsState";

/**
 * Settings panel.
 */
class Settings extends AsyncComponent<unknown, SettingsState> {
    /**
     * The theme service.
     */
    private readonly _themeService: ThemeService;

    /**
     * The auth service.
     */
    private readonly _authService: AuthService;

    /**
     * The standard sections that are not plugins.
     */
    private readonly _standardSections: string[];

    /**
     * Create a new instance of Settings.
     * @param props The props.
     */
    constructor(props: unknown) {
        super(props);

        this._themeService = ServiceFactory.get<ThemeService>("theme");
        this._authService = ServiceFactory.get<AuthService>("auth");
        this._standardSections = ["General"];

        this.state = {
            theme: this._themeService.get(),
            sections: this._standardSections,
            activeSection: this._standardSections[0],
            plugins: [],
            activePluginIndex: -1
        };
    }

    /**
     * The component did mount.
     */
    public async componentDidMount(): Promise<void> {
        super.componentDidMount();

        const plugins = [];

        if (this._authService.isLoggedIn()) {
            const pluginDetails = Spammer.pluginDetails();
            if (pluginDetails) {
                plugins.push(pluginDetails);
            }
        }

        if (plugins.length > 0) {
            this._standardSections.push("Plugins");
        }

        this.setState({
            sections: this._standardSections,
            plugins
        });
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="settings">
                <div className="content">
                    <TabPanel
                        tabs={this.state.sections}
                        activeTab={this.state.activeSection}
                        onTabChanged={activeTab => {
                            const lastSection = this.state.activeSection;
                            this.setState({
                                activeSection: activeTab
                            });
                            if (this._standardSections.includes(activeTab) &&
                                !this._standardSections.includes(lastSection)) {
                                this.setState({
                                    activePluginIndex: -1,
                                    sections: this.state.sections.filter(section => section !== lastSection)
                                });
                            }
                        }}
                    >
                        <div className="card padding-l">
                            <h2>General</h2>
                            <div className="card--label">
                                Theme
                            </div>
                            <div className="card--value">
                                <div className="select-wrapper">
                                    <select
                                        value={this.state.theme}
                                        onChange={e => this.setState(
                                            { theme: e.target.value },
                                            () => this._themeService.apply(this.state.theme, true))}
                                    >
                                        <option value="light">Light</option>
                                        <option value="dark">Dark</option>
                                    </select>
                                    <ChevronDownIcon />
                                </div>
                            </div>
                        </div>
                        <div className="plugins-container">
                            {this.state.plugins.map((p, idx) => (
                                <div className="card padding-l plugin" key={idx}>
                                    <div className="row middle spread">
                                        <div className="row middle">
                                            {p.icon}
                                            <h2 className="margin-l-s">{p.title}</h2>
                                        </div>
                                        <button
                                            type="button"
                                            className="icon-button"
                                            onClick={e => this.setState({
                                                sections: [...this.state.sections, p.title],
                                                activePluginIndex: idx,
                                                activeSection: p.title
                                            })}
                                        >
                                            <EllipsisIcon />
                                        </button>
                                    </div>
                                    <p>{p.description}</p>
                                </div>
                            ))}
                        </div>
                        {this.state.activePluginIndex >= 0 && (
                            <div className="card padding-l">
                                {this.state.plugins[this.state.activePluginIndex].settings}
                            </div>
                        )}
                    </TabPanel>
                </div>
            </div >
        );
    }
}

export default Settings;
