import classNames from "classnames";
import React, { Component, ReactNode } from "react";
import { ReactComponent as DropdownIcon } from "./../../../assets/dropdown-arrow.svg";
import { ProtocolParamsMilestonOptionProps } from "./ProtocolParamsMilestonOptionProps";
import { ProtocoParamsMilestoneOptionState } from "./ProtocolParamsMilestonOptionState";

/**
 * Component which will display a Protocol parameters milestone option.
 */
class ProtocolParamsMilestonOption
    extends Component<ProtocolParamsMilestonOptionProps, ProtocoParamsMilestoneOptionState> {
    /**
     * Create a new instance of Protocol params milestone option.
     * @param props The props.
     */
    constructor(props: ProtocolParamsMilestonOptionProps) {
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
                        Protocol Params
                    </h3>
                </div>
                {this.state.showDetails && (
                    <div className="card--content--border-l">
                        <div className="card--label">
                            Target Milestone Index
                        </div>
                        <div className="card--value">
                            {this.props.option.targetMilestoneIndex}
                        </div>
                        <div className="card--label">
                            Protocol version
                        </div>
                        <div className="card--value">
                            {this.props.option.protocolVersion}
                        </div>
                        <div className="card--label">
                            Params
                        </div>
                        <div className="card--value">
                            {this.props.option.params}
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default ProtocolParamsMilestonOption;
