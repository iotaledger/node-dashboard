import classNames from "classnames";
import React, { Component, ReactNode } from "react";
import { NameHelper } from "../../../utils/nameHelper";
import { ReactComponent as DropdownIcon } from "./../../../assets/dropdown-arrow.svg";
import "./Output.scss";
import { InputProps } from "./InputProps";
import { InputState } from "./InputState";
import Bech32Address from "./Bech32Address";

/**
 * Component which will display an output.
 */
class Input extends Component<InputProps, InputState> {
    /**
     * Create a new instance of Output.
     * @param props The props.
     */
    constructor(props: InputProps) {
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
            <div className="input margin-t-m">
                <div className="card--content padding-0">
                    <div
                        className="card--content__input"
                        onClick={() => this.setState({ showDetails: !this.state.showDetails })} >

                        <div className={classNames("margin-r-t", "card--content__input--dropdown", { opened: this.state.showDetails })}>
                            <DropdownIcon />
                        </div>
                        <h2>{NameHelper.getInputTypeName(this.props.input.type)} {this.props.index}</h2>
                    </div>

                    {this.state.showDetails && (
                        <div className="input__details">
                            <Bech32Address
                                activeLinks={true}
                                addressDetails={this.props.unlockAddress}
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

export default Input;
