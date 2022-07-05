/* eslint-disable max-len */
import { Blake2b } from "@iota/crypto.js";
import { Ed25519Address, IReferenceUnlock, ISignatureUnlock, REFERENCE_UNLOCK_TYPE, SIGNATURE_UNLOCK_TYPE, ALIAS_UNLOCK_TYPE, NFT_UNLOCK_TYPE, serializeTransactionPayload, AddressTypes, IEd25519Address, ED25519_ADDRESS_TYPE, TransactionHelper } from "@iota/iota.js";
import { Converter, WriteStream } from "@iota/util.js";
import React, { Component, ReactNode } from "react";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { NodeConfigService } from "../../../services/nodeConfigService";
import Pagination from "../layout/Pagination";
import Output from "./Output";
import { TransactionPayloadProps } from "./TransactionPayloadProps";
import { TransactionPayloadState } from "./TransactionPayloadState";
import UTXOInput from "./UTXOInput";

/**
 * Component which will display a transaction payload.
 */
class TransactionPayload extends Component<TransactionPayloadProps, TransactionPayloadState> {
    /**
     * The bech32 hrp from the node.
     */
    private readonly _bech32Hrp: string;

    /**
     * Create a new instance of TransactionPayload.
     * @param props The props.
     */
    constructor(props: TransactionPayloadProps) {
        super(props);

        const nodeConfigService = ServiceFactory.get<NodeConfigService>("node-config");
        this._bech32Hrp = nodeConfigService.getBech32Hrp();

        const signatureBlocks: ISignatureUnlock[] = [];
        for (let i = 0; i < props.payload.unlocks.length; i++) {
            if (props.payload.unlocks[i].type === SIGNATURE_UNLOCK_TYPE) {
                const sigUnlockBlock = props.payload.unlocks[i] as ISignatureUnlock;
                signatureBlocks.push(sigUnlockBlock);
            } else if (
                props.payload.unlocks[i].type === REFERENCE_UNLOCK_TYPE ||
                props.payload.unlocks[i].type === ALIAS_UNLOCK_TYPE ||
                props.payload.unlocks[i].type === NFT_UNLOCK_TYPE) {
                    const refUnlockBlock = props.payload.unlocks[i] as IReferenceUnlock;
                    signatureBlocks.push(props.payload.unlocks[refUnlockBlock.reference] as ISignatureUnlock);
            }
        }

        const unlockAddresses: AddressTypes[] = [];
        for (let i = 0; i < signatureBlocks.length; i++) {
            unlockAddresses.push({ pubKeyHash: Converter.bytesToHex(
                new Ed25519Address(Converter.hexToBytes(signatureBlocks[i].signature.publicKey))
                    .toAddress()
            ), type: ED25519_ADDRESS_TYPE } as IEd25519Address);
        }

        const writeStream = new WriteStream();
        try {
            serializeTransactionPayload(writeStream, this.props.payload);
        } catch (error) {
            if (error instanceof Error) {
                console.log(error.message);
            }
        }
        const transactionId = Converter.bytesToHex(Blake2b.sum256(writeStream.finalBytes()), true);

        this.state = {
            unlockAddresses,
            transactionId,
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
     * Get outputs on the current page.
     * @returns The outputs on the current page.
     */
    private get currentPageOutputs() {
        if (this.props.payload.essence.outputs.length > 0) {
            const [firstPageIndex, lastPageIndex] = this.getPageIndexes(this.state.currentOutputsPage, this.state.outputsPageSize, this.props.payload.essence.outputs.length);

            return this.props.payload.essence.outputs.slice(firstPageIndex, lastPageIndex);
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

                <div className="card margin-t-m padding-l">
                    <div className="card--header">
                        <h2 className="card--header__title">Outputs</h2>
                        <span className="card--header-count">
                            {this.props.payload.essence.outputs.length}
                        </span>
                    </div>
                    {this.currentPageOutputs.map((output, idx) => (
                        <Output
                            key={this.getPageIndex(this.state.currentOutputsPage, this.state.outputsPageSize, idx)}
                            index={this.getPageIndex(this.state.currentOutputsPage, this.state.outputsPageSize, idx)}
                            output={output}
                            outputId={TransactionHelper.outputIdFromTransactionData(this.state.transactionId, this.getPageIndex(this.state.currentOutputsPage, this.state.outputsPageSize, idx))}
                        />
                    ))}

                    <Pagination
                        currentPage={this.state.currentOutputsPage}
                        totalCount={this.props.payload.essence.outputs.length}
                        pageSize={this.state.outputsPageSize}
                        extraPageRangeLimit={20}
                        siblingsCount={1}
                        onPageChange={page =>
                            this.setState({ currentOutputsPage: page })}
                    />
                </div>
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
