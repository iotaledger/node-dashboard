import classNames from "classnames";
import React, { Component, ReactNode } from "react";
import "./InfoPanel.scss";
import { InfoPanelProps } from "./InfoPanelProps";
import Tooltip from "./Tooltip";

const SYNC_STATUS_CAPTION = "Finalized Slot / Committed Slot";

/**
 * Info panel.
 */
class InfoPanel extends Component<InfoPanelProps> {
    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        let latestFinalizedSlot = "";
        let latestCommitmentSlot = "";
        if (this.props.caption === SYNC_STATUS_CAPTION && this.props.value) {
            const slots = this.props.value.split("/");
            latestFinalizedSlot = slots[0];
            latestCommitmentSlot = slots[1];
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
                        this.props.caption === SYNC_STATUS_CAPTION ?
                            <Tooltip
                                tooltipContent={this.props.value ?? "-"}
                            >
                                {
                                    this.props.value ?
                                        <div className="value">
                                            {latestFinalizedSlot} / <span className="lmi">{latestCommitmentSlot}</span>
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
