import { ADDRESS_UNLOCK_CONDITION_TYPE, EXPIRATION_UNLOCK_CONDITION_TYPE, GOVERNOR_ADDRESS_UNLOCK_CONDITION_TYPE, IMMUTABLE_ALIAS_UNLOCK_CONDITION_TYPE, STORAGE_DEPOSIT_RETURN_UNLOCK_CONDITION_TYPE, TIMELOCK_UNLOCK_CONDITION_TYPE } from "@iota/iota.js";
import React, { Component, ReactNode } from "react";
import { NameHelper } from "../../../utils/nameHelper";
import Address from "./Address";
import { UnlockConditionProps } from "./UnlockConditionProps";

/**
 * Component which will display an unlock condition.
 */
class UnlockCondition extends Component<UnlockConditionProps> {

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="unlock-condition">
                <h3>{NameHelper.getUnlockConditionTypeName(this.props.unlockCondition.type)}</h3>

                {this.props.unlockCondition.type === ADDRESS_UNLOCK_CONDITION_TYPE && (
                    <React.Fragment>
                        <div className="card--label">
                            Name:
                        </div>
                        <div className="card--value row">
                            {NameHelper.getAddressTypeName(this.props.unlockCondition.address.type)}
                        </div>
                        <Address
                            address={this.props.unlockCondition.address}
                        />
                    </React.Fragment>
                )}
                {this.props.unlockCondition.type === STORAGE_DEPOSIT_RETURN_UNLOCK_CONDITION_TYPE && (
                    <React.Fragment>
                        <div className="card--label">
                            Return address
                        </div>
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
                        <div className="card--label">
                            Return address:
                        </div>
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
                {this.props.unlockCondition.type === GOVERNOR_ADDRESS_UNLOCK_CONDITION_TYPE && (
                    <React.Fragment>
                        <div className="card--label">
                            Governor address:
                        </div>
                        <Address
                            address={this.props.unlockCondition.address}
                        />
                    </React.Fragment>
                )}
                {this.props.unlockCondition.type === IMMUTABLE_ALIAS_UNLOCK_CONDITION_TYPE && (
                    <React.Fragment>
                        <div className="card--label">
                            Immutable address:
                        </div>
                        <Address
                            address={this.props.unlockCondition.address}
                        />
                    </React.Fragment>
                )}
                <div className="card--label">
                    Type:
                </div>
                <div className="card--value row">
                    {this.props.unlockCondition.type}
                </div>
            </div>
        );
    }
}

export default UnlockCondition;
