import classNames from "classnames";
import React, { Component, ReactNode } from "react";
import { ReactComponent as DropdownIcon } from "./../../../assets/dropdown-arrow.svg";
import { PoWMilestoneOptionProps } from "./PoWMilestoneOptionProps";
import { PoWMilestoneOptionState } from "./PoWMilestoneOptionState";

/**
 * Component which will display a PoW milestone option.
 */
class PoWMilestoneOption extends Component<PoWMilestoneOptionProps, PoWMilestoneOptionState> {
    /**
     * Create a new instance of PoW milestone option.
     * @param props The props.
     */
    constructor(props: PoWMilestoneOptionProps) {
        super(props);

        this.state = {
            showDetails: false
        };
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="milestone-payload_receipt padding-t-s">
                <div
                    className="card--content__input"
                    onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                >

                    <div className={classNames(
                            "margin-r-t",
                            "card--content__input--dropdown",
                            { "opened": this.state.showDetails }
                        )}
                    >
                        <DropdownIcon />
                    </div>
                    <h3 className="card--content__input--label">
                        PoW
                    </h3>
                </div>
                {this.state.showDetails && (
                    <div className="card--content--border-l">
                        <div className="card--label">
                            Next PoW Score
                        </div>
                        <div className="card--value">
                            {this.props.option.nextPoWScore}
                        </div>
                        <div className="card--label">
                            Next PoW Score Milestone Index
                        </div>
                        <div className="card--value">
                            {this.props.option.nextPoWScoreMilestoneIndex}
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default PoWMilestoneOption;
