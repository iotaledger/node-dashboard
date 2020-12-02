import classNames from "classnames";
import React, { Component, ReactNode } from "react";
import "./Confirmation.scss";
import { ConfirmationProps } from "./ConfirmationProps";

/**
 * Component which will display a confirmation.
 */
class Confirmation extends Component<ConfirmationProps> {
    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div
                onClick={this.props.onClick}
                className={
                    classNames(
                        "confirmation",
                        { "confirmation__no-click": !this.props.onClick },
                        { "confirmation__referenced": this.props.state === "referenced" },
                        { "confirmation__pending": this.props.state === "pending" },
                        { "confirmation__unknown": this.props.state === "unknown" }
                    )
                }
            >
                {this.props.state === "unknown" && ("Unknown")}
                {this.props.state === "referenced" &&
                    (`Referenced${this.props.milestoneIndex !== undefined && this.props.milestoneIndex > 1
                        ? ` by MS ${this.props.milestoneIndex}` : ""}`)}
                {this.props.state === "pending" && ("Pending")}
            </div>
        );
    }
}

export default Confirmation;
