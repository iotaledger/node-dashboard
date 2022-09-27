import classNames from "classnames";
import React, { Component, ReactNode } from "react";
import { NameHelper } from "../../../utils/nameHelper";
import { ReactComponent as DropdownIcon } from "./../../../assets/dropdown-arrow.svg";
import Bech32Address from "./Bech32Address";
import { UTXOInputProps } from "./UTXOInputProps";
import { UTXOInputState } from "./UTXOInputState";

/**
 * Component which will display an UTXO Iput.
 */
class UTXOInput extends Component<UTXOInputProps, UTXOInputState> {
    /**
     * Create a new instance of UTXO Iput.
     * @param props The props.
     */
    constructor(props: UTXOInputProps) {
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
            <div className="utxo-input margin-t-m">
                <div className="card--content padding-0">
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
                            {NameHelper.getInputTypeName(this.props.input.type)} {this.props.index}
                        </h3>
                    </div>

                    {this.state.showDetails && (
                        <div className="card--content--border-l">
                            <Bech32Address
                                activeLinks={true}
                                showHexAddress={true}
                                address={this.props.unlockAddress}
                            />
                            <div className="card--label">
                                Transaction Id
                            </div>
                            <div className="card--value card--value__mono">
                                {this.props.input.transactionId === "0".repeat(64) && (
                                    <span>Genesis</span>
                                )}
                                {this.props.input.transactionId !== "0".repeat(64) && this.props.input.transactionId}
                            </div>
                            <div className="card--label">
                                Transaction Output Index
                            </div>
                            <div className="card--value">
                                {this.props.input.transactionOutputIndex}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export default UTXOInput;
