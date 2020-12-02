import classNames from "classnames";
import React, { Component, ReactNode } from "react";
import HealthBadIcon from "../../../assets/health-bad.svg";
import HealthGoodIcon from "../../../assets/health-good.svg";
import "./HealthIndicator.scss";
import { HealthIndicatorProps } from "./HealthIndicatorProps";

/**
 * Health Indicator.
 */
class HealthIndicator extends Component<HealthIndicatorProps> {
    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className={classNames("health-indicator", this.props.className)}>
                <img src={this.props.healthy ? HealthGoodIcon : HealthBadIcon} />
                <span className="label">{this.props.label}</span>
            </div>
        );
    }
}

export default HealthIndicator;
