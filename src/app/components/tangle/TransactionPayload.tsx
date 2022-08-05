/* eslint-disable max-len */
import { TransactionHelper } from "@iota/iota.js";
import { Converter } from "@iota/util.js";
import React, { Component, ReactNode } from "react";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { IAssociatedOutput } from "../../../models/tangle/IAssociatedOutputsResponse";
import { TangleService } from "../../../services/tangleService";
import Outputs from "./Outputs";
import { TransactionPayloadProps } from "./TransactionPayloadProps";
import { TransactionPayloadState } from "./TransactionPayloadState";

/**
 * Component which will display a transaction payload.
 */
class TransactionPayload extends Component<TransactionPayloadProps, TransactionPayloadState> {
    /**
     * Service for tangle requests.
     */
     private readonly _tangleService: TangleService;

    /**
     * Create a new instance of TransactionPayload.
     * @param props The props.
     */
    constructor(props: TransactionPayloadProps) {
        super(props);
        this._tangleService = ServiceFactory.get<TangleService>("tangle");

        const inputs = this.props.payload.essence.inputs
            .map((input, idx) => {
                const output: IAssociatedOutput = {
                    outputId: TransactionHelper.outputIdFromTransactionData(input.transactionId, input.transactionOutputIndex)
                };
                return output;
            });

        const outputs = this.props.payload.essence.outputs
            .map((output, idx) => {
                const transactionId = Converter.bytesToHex(TransactionHelper.getTransactionPayloadHash(this.props.payload), true);

                const associatedOutput: IAssociatedOutput = {
                    outputId: TransactionHelper.outputIdFromTransactionData(transactionId, idx),
                    outputType: output
                };
                return associatedOutput;
            });

        this.state = {
            outputs,
            currentOutputsPage: 1,
            outputsPageSize: 20,
            inputs,
            statusInputsBusy: false
        };
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="transaction-payload">
                {this.state.inputs.length > 0 && (
                    <Outputs
                        outputs={this.state.inputs}
                        currentPage={1}
                        pageSize={10}
                        extraPageRangeLimit={20}
                        siblingsCount={1}
                        statusBusy={this.state.statusInputsBusy}
                        title="Inputs"
                        onPageChange={(page: number, firstPageIndex: number, lastPageIndex: number) => {
                            if (this.state.inputs.length > 0) {
                                this.updateOutputDetails(
                                    firstPageIndex,
                                    lastPageIndex
                                ).catch(err => console.error(err));
                            }
                        }}
                    />
                )}
                {this.state.outputs.length > 0 && (
                    <Outputs
                        outputs={this.state.outputs}
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
     * Update output details from start to end index.
     * @param startIndex The start index of the output.
     * @param endIndex The end index of the output.
     */
    private async updateOutputDetails(
        startIndex: number,
        endIndex: number) {
        const outputs = [...this.state.inputs];
        if (outputs.length > 0) {
            this.setState({ statusInputsBusy: true });

            for (let i = startIndex; i < endIndex; i++) {
                const outputResult = await this._tangleService.outputDetails(outputs[i].outputId);

                if (outputResult) {
                    outputs[i].outputDetails = outputResult;
                    this.setState(prevState => ({
                        ...prevState,
                        inputs: outputs
                    }));
                }
            }

            this.setState({ statusInputsBusy: false });
        }
    }
}

export default TransactionPayload;
