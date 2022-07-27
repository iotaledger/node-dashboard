/* eslint-disable max-len */
import { Ed25519Address, IReferenceUnlock, ISignatureUnlock, REFERENCE_UNLOCK_TYPE, SIGNATURE_UNLOCK_TYPE, ALIAS_UNLOCK_TYPE, NFT_UNLOCK_TYPE, AddressTypes, IEd25519Address, ED25519_ADDRESS_TYPE } from "@iota/iota.js";
import { Converter } from "@iota/util.js";
import React, { Component, ReactNode } from "react";
import Pagination from "../layout/Pagination";
import Outputs from "./Outputs";
import { TransactionPayloadProps } from "./TransactionPayloadProps";
import { TransactionPayloadState } from "./TransactionPayloadState";
import UTXOInput from "./UTXOInput";

/**
 * Component which will display a transaction payload.
 */
class TransactionPayload extends Component<TransactionPayloadProps, TransactionPayloadState> {
    /**
     * Create a new instance of TransactionPayload.
     * @param props The props.
     */
    constructor(props: TransactionPayloadProps) {
        super(props);

        const signatureBlocks: ISignatureUnlock[] = [];
        const unlocks = props.payload.unlocks;
        for (let i = 0; i < unlocks.length; i++) {
            if (unlocks[i].type === SIGNATURE_UNLOCK_TYPE) {
                signatureBlocks.push(unlocks[i] as ISignatureUnlock);
            } else if (
                unlocks[i].type === REFERENCE_UNLOCK_TYPE ||
                unlocks[i].type === ALIAS_UNLOCK_TYPE ||
                unlocks[i].type === NFT_UNLOCK_TYPE) {
                    let refUnlockIdx = i;
                    let signatureUnlock: ISignatureUnlock;
                    // unlock references can be transitive,
                    // so we need to follow the path until we find the signature
                    do {
                        const referenceUnlock = unlocks[refUnlockIdx] as IReferenceUnlock;
                        signatureUnlock = unlocks[referenceUnlock.reference] as ISignatureUnlock;
                        refUnlockIdx = referenceUnlock.reference;
                    } while (!signatureUnlock.signature)

                    signatureBlocks.push(signatureUnlock);
            }
        }

        const unlockAddresses: AddressTypes[] = [];
        for (let i = 0; i < signatureBlocks.length; i++) {
            unlockAddresses.push({ pubKeyHash: Converter.bytesToHex(
                new Ed25519Address(Converter.hexToBytes(signatureBlocks[i].signature.publicKey))
                    .toAddress()
            ), type: ED25519_ADDRESS_TYPE } as IEd25519Address);
        }

        this.state = {
            unlockAddresses,
            currentOutputsPage: 1,
            outputsPageSize: 20,
            currentInputsPage: 1,
            inputsPageSize: 20
        };
    }

    /**
     * Get the utxo inputs on the current page.
     * @returns The inputs on the current page.
     */
    private get currentPageInputs() {
        if (this.props.payload.essence.inputs.length > 0) {
            const [firstPageIndex, lastPageIndex] = this.getPageIndexes(this.state.currentInputsPage, this.state.inputsPageSize, this.props.payload.essence.inputs.length);

            return this.props.payload.essence.inputs.slice(firstPageIndex, lastPageIndex);
        }
        return [];
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="transaction-payload">
                <div className="card margin-t-m padding-l">
                    <div className="card--header">
                        <h2 className="card--header__title">Inputs</h2>
                        <span className="card--header-count">
                            {this.props.payload.essence.inputs.length}
                        </span>
                    </div>
                    {this.currentPageInputs.map((input, idx) => (
                        <UTXOInput
                            key={this.getPageIndex(this.state.currentInputsPage, this.state.inputsPageSize, idx)}
                            index={this.getPageIndex(this.state.currentInputsPage, this.state.inputsPageSize, idx)}
                            unlockAddress={this.state.unlockAddresses[idx]}
                            input={input}
                        />
                    ))}

                    <Pagination
                        currentPage={this.state.currentInputsPage}
                        totalCount={this.props.payload.essence.inputs.length}
                        pageSize={this.state.inputsPageSize}
                        extraPageRangeLimit={20}
                        siblingsCount={1}
                        onPageChange={page =>
                            this.setState({ currentInputsPage: page })}
                    />
                </div>

                {this.props.payload.essence.outputs.length > 0 && (
                    <Outputs
                        outputTypes={this.props.payload.essence.outputs}
                        currentPage={this.state.currentOutputsPage}
                        pageSize={this.state.outputsPageSize}
                        extraPageRangeLimit={20}
                        siblingsCount={1}
                        title="Outputs"
                    />
                )}
            </div>
        );
    }

    /**
     * Get first and last item index.
     * @param currentPage The current pag of the paginator.
     * @param pageSize The Page size of the paginator.
     * @param length The lengt of the array.
     * @returns The first and last item index on the current page.
     */
    public getPageIndexes(currentPage: number, pageSize: number, length: number) {
        const firstPageIndex = (currentPage - 1) * pageSize;
        const lastPageIndex =
            (currentPage === Math.ceil(length / pageSize))
            ? length
            : firstPageIndex + pageSize;
        return [firstPageIndex, lastPageIndex] as const;
    }

    /**
     * Get item index on the current page.
     * @param currentPage The current pag of the paginator.
     * @param pageSize The Page size of the paginator.
     * @param index The lengt of the array.
     * @returns The item index on the current page.
     */
    public getPageIndex(currentPage: number, pageSize: number, index: number): number {
        return ((currentPage - 1) * pageSize) + index + 1;
    }
}

export default TransactionPayload;
