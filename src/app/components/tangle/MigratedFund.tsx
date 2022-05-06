import { ED25519_ADDRESS_TYPE } from "@iota/iota.js";
import classNames from "classnames";
import React, { Component, ReactNode } from "react";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { NodeConfigService } from "../../../services/nodeConfigService";
import { Bech32AddressHelper } from "../../../utils/bech32AddressHelper";
import { FormatHelper } from "../../../utils/formatHelper";
import { ReactComponent as DropdownIcon } from "./../../../assets/dropdown-arrow.svg";
import Bech32Address from "./Bech32Address";
import { MigratedFundProps } from "./MigratedFundProps";
import { MigratedFundState } from "./MigratedFundState";

/**
 * Component which will display a Migrated fund.
 */
class MigratedFund extends Component<MigratedFundProps, MigratedFundState> {
    /**
     * The bech32 hrp from the node.
     */
     private readonly _bech32Hrp: string;

    /**
     * Create a new instance of Migrated fund.
     * @param props The props.
     */
    constructor(props: MigratedFundProps) {
        super(props);

        const nodeConfigService = ServiceFactory.get<NodeConfigService>("node-config");
        this._bech32Hrp = nodeConfigService.getBech32Hrp();

        this.state = {
            formatFull: false,
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
                        Migrated Fund {this.props.index}
                    </h3>
                </div>
                {this.state.showDetails && (
                    <div className="card--content--border-l">
                        <div className="card--label">
                            Tail Transaction Hash
                        </div>
                        <div className="card--value card--value__mono">
                            {this.props.fund.tailTransactionHash}
                        </div>
                        <div className="card--value card--value__mono">
                            {this.props.fund.address.type === ED25519_ADDRESS_TYPE && (
                                <Bech32Address
                                    activeLinks={true}
                                    addressDetails={Bech32AddressHelper.buildAddress(
                                            this.props.fund.address.pubKeyHash,
                                            this._bech32Hrp
                                    )}
                                />
                            )}
                        </div>
                        <div className="card--label">
                            Deposit
                        </div>
                        <div className="card--value card--value__mono">
                            <button
                                className="card--value--button"
                                type="button"
                                onClick={() => this.setState(
                                    {
                                        formatFull: !this.state.formatFull
                                    }
                                )}
                            >
                                {FormatHelper.amount(Number(this.props.fund.deposit), this.state.formatFull)}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default MigratedFund;
