import classNames from "classnames";
import React, { Component, ReactNode } from "react";
import "./InfoPanel.scss";
import { InfoPanelProps } from "./InfoPanelProps";
import Tooltip from "./Tooltip";

const MILESTONE_CAPTION = "CMI / LMI";

/**
 * Info panel.
 */
class InfoPanel extends Component<InfoPanelProps> {
    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        let cmi = "";
        let lmi = "";
        if (this.props.caption === MILESTONE_CAPTION && this.props.value) {
            const milestone = this.props.value.split("/");
            cmi = milestone[0];
            lmi = milestone[1];
        }
        return (
            <div className={classNames("card", "info-panel", this.props.className)}>
                <div className="icon-container">
                    <div className={`icon-background icon-background--${this.props.backgroundStyle}`} />
                    {this.props.icon}
                </div>
                <div className="col info--labels">
                    <h4>{this.props.caption}</h4>
                    {
                        this.props.caption === MILESTONE_CAPTION ?
                            <Tooltip
                                tooltipContent={this.props.value ?? "-"}
                            >
                                {
                                    this.props.value ?
                                        <div className="value">
                                            {cmi} / <span className="lmi">{lmi}</span>
                                        </div> :
                                        "-"
                                }
                            </Tooltip> :
                            <div className="value">{this.props.value ?? "-"}</div>
                    }
                </div>
            </div>
        );
    }
}

export default InfoPanel;
