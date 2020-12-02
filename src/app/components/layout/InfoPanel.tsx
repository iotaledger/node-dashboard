import classNames from "classnames";
import React, { Component, ReactNode } from "react";
import "./InfoPanel.scss";
import { InfoPanelProps } from "./InfoPanelProps";

/**
 * Info panel.
 */
class InfoPanel extends Component<InfoPanelProps> {
    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className={classNames("card", "info-panel", this.props.className)}>
                <div className={`icon-background icon-background--${this.props.backgroundStyle}`}>
                    {this.props.icon}
                </div>
                <div className="col">
                    <h4 className="margin-t-s">{this.props.caption}</h4>
                    <div className="value">{this.props.value ?? "-"}</div>
                </div>
            </div>
        );
    }
}

export default InfoPanel;
