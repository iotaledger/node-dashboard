import { ALIAS_ADDRESS_TYPE, ED25519_ADDRESS_TYPE } from "@iota/iota.js";
import React, { Component, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { NodeConfigService } from "../../../services/nodeConfigService";
import { Bech32AddressHelper } from "../../../utils/bech32AddressHelper";
import { ClipboardHelper } from "../../../utils/clipboardHelper";
import { NameHelper } from "../../../utils/nameHelper";
import MessageButton from "../layout/MessageButton";
import { Bech32AddressProps } from "./Bech32AddressProps";
import { Bech32AddressState } from "./Bech32AddressState";

/**
 * Component which will display an Bech32Address.
 */
class Bech32Address extends Component<Bech32AddressProps, Bech32AddressState> {
    /**
     * Create a new instance of Bech 32 Address
     * @param props The props.
     */
    constructor(props: Bech32AddressProps) {
        super(props);

        if (this.props.address) {
            const nodeConfigService = ServiceFactory.get<NodeConfigService>("node-config");

            const hash = this.props.address.type === ED25519_ADDRESS_TYPE
                        ? this.props.address?.pubKeyHash
                        : (this.props.address.type === ALIAS_ADDRESS_TYPE
                            ? this.props.address?.aliasId
                            : this.props.address?.nftId);

            this.state = {
                addressDetails: Bech32AddressHelper.buildAddress(
                                    hash,
                                    nodeConfigService.getBech32Hrp(),
                                    this.props.address.type
                                )
            };
        } else if (this.props.addressDetails) {
            this.state = {
                addressDetails: this.props.addressDetails
            };
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="bech32-address">
                {this.state.addressDetails.bech32 && (
                    <React.Fragment>
                        <div className="card--label">
                            {this.state.addressDetails.type
                                ? NameHelper.getAddressTypeName(this.state.addressDetails.type)
                                : "Address"}
                        </div>
                        <div className="card--value card--value__mono row">
                            {this.props.activeLinks && (
                                <Link
                                    className="margin-r-t"
                                    to={`/explorer/address/${this.state.addressDetails?.bech32}`}
                                >
                                    {this.state.addressDetails.bech32}
                                </Link>
                            )}
                            {!this.props.activeLinks && (
                                <span className="margin-r-t">{this.state.addressDetails.bech32}</span>
                            )}
                            <MessageButton
                                onClick={() => ClipboardHelper.copy(this.state.addressDetails?.bech32)}
                                buttonType="copy"
                                labelPosition="top"
                            />
                        </div>
                    </React.Fragment>
                )}
                {this.props.showHexAddress &&
                this.state.addressDetails?.hex && (
                    <React.Fragment>
                        <div className="card--label">
                            {this.state.addressDetails.typeLabel} Address
                        </div>
                        <div className="card--value card--value__mono row">
                            {this.props.activeLinks && (
                                <Link
                                    className="margin-r-t"
                                    to={`/explorer/address/${this.state.addressDetails?.hex}`}
                                >
                                    {this.state.addressDetails?.hex}
                                </Link>
                            )}
                            {!this.props.activeLinks && (
                                <span className="margin-r-t">{this.state.addressDetails?.hex}</span>
                            )}
                            <MessageButton
                                onClick={() => ClipboardHelper.copy(this.state.addressDetails?.hex)}
                                buttonType="copy"
                                labelPosition="top"
                            />
                        </div>
                    </React.Fragment>
                )}
            </div>
        );
    }
}

export default Bech32Address;
