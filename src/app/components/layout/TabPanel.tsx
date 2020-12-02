import classNames from "classnames";
import React, { Component, ReactNode } from "react";
import "./TabPanel.scss";
import { TabPanelProps } from "./TabPanelProps";
import { TabPanelState } from "./TabPanelState";

/**
 * Tab panel.
 */
class TabPanel extends Component<TabPanelProps, TabPanelState> {
    /**
     * Create a new instance of TabPanel.
     * @param props The props.
     */
    constructor(props: TabPanelProps) {
        super(props);

        this.state = {
            activeTab: props.labels[0]
        };
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="tab-panel">
                <div className="tab-panel--buttons">
                    {this.props.labels.map(l => (
                        <button
                            key={l}
                            type="button"
                            className={classNames(
                                "tab-panel--button",
                                { "tab-panel--button__selected": l === this.state.activeTab }
                            )}
                            onClick={e => this.setState({ activeTab: l })}
                        >
                            <div>{l}</div>
                            <div className="underline" />
                        </button>
                    ))}
                </div>
                {this.props.children?.map((c, idx) => (
                    <React.Fragment key={idx}>
                        {this.props.labels[idx] === this.state.activeTab && c}
                    </React.Fragment>
                ))}
            </div>
        );
    }
}

export default TabPanel;
