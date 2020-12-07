import React, { Component, ReactNode } from "react";
import { ReactComponent as ChevronDownIcon } from "../../assets/chevron-down.svg";
import { ServiceFactory } from "../../factories/serviceFactory";
import { ThemeService } from "../../services/themeService";
import TabPanel from "../components/layout/TabPanel";
import "./Settings.scss";
import { SettingsState } from "./SettingsState";

/**
 * Settings panel.
 */
class Settings extends Component<unknown, SettingsState> {
    /**
     * The theme service.
     */
    private readonly _themeService: ThemeService;

    /**
     * Create a new instance of Settings.
     * @param props The props.
     */
    constructor(props: unknown) {
        super(props);

        this._themeService = ServiceFactory.get<ThemeService>("theme");

        this.state = {
            theme: this._themeService.get()
        };
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="analytics">
                <div className="content">
                    <TabPanel labels={["General", "Spammer"]}>
                        <div className="card padding-l">
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
                        <div className="card padding-l">
                            <div className="card--label">
                                <p>Nothing to see here, move along.</p>
                            </div>
                        </div>
                    </TabPanel>
                </div>
            </div>
        );
    }
}

export default Settings;
