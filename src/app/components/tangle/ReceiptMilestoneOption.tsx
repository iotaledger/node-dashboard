import { ED25519_ADDRESS_TYPE, UnitsHelper } from "@iota/iota.js";
import React, { Component, ReactNode } from "react";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { NodeConfigService } from "../../../services/nodeConfigService";
import { Bech32AddressHelper } from "../../../utils/bech32AddressHelper";
import Bech32Address from "./Bech32Address";
import { ReceiptMilestoneOptionProps } from "./ReceiptMilestoneOptionProps";
import { ReceiptMilestoneOptionState } from "./ReceiptMilestoneOptionState";

/**
 * Component which will display a receipt payload.
 */
class ReceiptMilestoneOption extends Component<ReceiptMilestoneOptionProps, ReceiptMilestoneOptionState> {
    /**
     * The bech32 hrp from the node.
     */
    private readonly _bech32Hrp: string;

    /**
     * Create a new instance of ReceiptPayload.
     * @param props The props.
     */
    constructor(props: ReceiptMilestoneOptionProps) {
        super(props);

        const nodeConfigService = ServiceFactory.get<NodeConfigService>("node-config");
        this._bech32Hrp = nodeConfigService.getBech32Hrp();

        this.state = {
            formatFull: false
        };
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="receipt-payload">
                <h2>Receipt Payload</h2>
                <div className="card--label">
                    Migrated At
                </div>
                <div className="card--value row">
                    {this.props.option.migratedAt}
                </div>
                <div className="card--label">
                    Final
                </div>
                <div className="card--value row">
                    <div className="margin-b-m">
                        {this.props.option.final ? "Yes" : "No"}
                    </div>
                </div>
                {this.props.option.funds.map((f, idx) => (
                    <div
                        key={idx}
                        className="margin-b-s"
                    >
                        <h3 className="margin-b-t">Migrated Fund {idx}</h3>
                        <div className="card--label">
                            Tail Transaction Hash
                        </div>
                        <div className="card--value card--value__mono">
                            {f.tailTransactionHash}
                        </div>
                        <div className="card--value card--value__mono">
                            {f.address.type === ED25519_ADDRESS_TYPE && (
                                <Bech32Address
                                    activeLinks={true}
                                    addressDetails={
                                        Bech32AddressHelper.buildAddress(f.address.pubKeyHash, this._bech32Hrp)
                                    }
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
                                {this.state.formatFull
                                    ? `${f.deposit} i` : UnitsHelper.formatBest(Number(f.deposit))}
                            </button>
                        </div>
                    </div>
                ))}
                <div className="card--label">
                    Input Transaction Milestone Id
                </div>
                <div className="card--value card--value__mono">
                    {this.props.option.transaction.input.milestoneId}
                </div>
                <div className="card--label">
                    Output Transaction Amount to Treasury
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
                        {this.state.formatFull
                            ? `${this.props.option.transaction.output.amount} i`
                            : UnitsHelper.formatBest(Number(this.props.option.transaction.output.amount))}
                    </button>
                </div>
            </div>
        );
    }
}

export default ReceiptMilestoneOption;
