import { ADDRESS_UNLOCK_CONDITION_TYPE, EXPIRATION_UNLOCK_CONDITION_TYPE, STATE_CONTROLLER_ADDRESS_UNLOCK_CONDITION_TYPE, GOVERNOR_ADDRESS_UNLOCK_CONDITION_TYPE, IMMUTABLE_ALIAS_UNLOCK_CONDITION_TYPE, STORAGE_DEPOSIT_RETURN_UNLOCK_CONDITION_TYPE, TIMELOCK_UNLOCK_CONDITION_TYPE } from "@iota/iota.js";
import classNames from "classnames";
import React, { Component, ReactNode } from "react";
import { NameHelper } from "../../../utils/nameHelper";
import { ReactComponent as DropdownIcon } from "./../../../assets/dropdown-arrow.svg";
import Address from "./Address";
import { UnlockConditionProps } from "./UnlockConditionProps";
import { UnlockCondtionState } from "./UnlockConditionState";

/**
 * Component which will display an unlock condition.
 */
class UnlockCondition extends Component<UnlockConditionProps, UnlockCondtionState > {
    /**
     * Create a new instance of Output.
     * @param props The props.
     */
     constructor(props: UnlockConditionProps) {
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
            <div className="unlock-condition padding-t-s">
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
                        {NameHelper.getUnlockConditionTypeName(this.props.unlockCondition.type)}
                    </h3>
                </div>

                {this.state.showDetails && (
                    <div className="card--content--border-l">
                        {(this.props.unlockCondition.type === ADDRESS_UNLOCK_CONDITION_TYPE ||
                        this.props.unlockCondition.type === STATE_CONTROLLER_ADDRESS_UNLOCK_CONDITION_TYPE ||
                        this.props.unlockCondition.type === GOVERNOR_ADDRESS_UNLOCK_CONDITION_TYPE ||
                        this.props.unlockCondition.type === IMMUTABLE_ALIAS_UNLOCK_CONDITION_TYPE) && (
                            <Address
                                address={this.props.unlockCondition.address}
                            />
                        )}
                        {this.props.unlockCondition.type === STORAGE_DEPOSIT_RETURN_UNLOCK_CONDITION_TYPE && (
                            <React.Fragment>
                                <Address
                                    address={this.props.unlockCondition.returnAddress}
                                />
                                <div className="card--label">
                                    Amount:
                                </div>
                                <div className="card--value row">
                                    {this.props.unlockCondition.amount}
                                </div>
                            </React.Fragment>
                        )}
                        {this.props.unlockCondition.type === TIMELOCK_UNLOCK_CONDITION_TYPE && (
                            <React.Fragment>
                                <div className="card--label">
                                    Milestone index
                                </div>
                                <div className="card--value row">
                                    {this.props.unlockCondition.milestoneIndex}
                                </div>
                                <div className="card--label">
                                    Unix time
                                </div>
                                <div className="card--value row">
                                    {this.props.unlockCondition.unixTime}
                                </div>
                            </React.Fragment>
                        )}
                        {this.props.unlockCondition.type === EXPIRATION_UNLOCK_CONDITION_TYPE && (
                            <React.Fragment>
                                <Address
                                    address={this.props.unlockCondition.returnAddress}
                                />
                                <div className="card--label">
                                    Milestone index
                                </div>
                                <div className="card--value row">
                                    {this.props.unlockCondition.milestoneIndex}
                                </div>
                                <div className="card--label">
                                    Unix time
                                </div>
                                <div className="card--value row">
                                    {this.props.unlockCondition.unixTime}
                                </div>
                            </React.Fragment>
                        )}
                        <div className="card--label">
                            Type:
                        </div>
                        <div className="card--value row">
                            {this.props.unlockCondition.type}
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default UnlockCondition;
