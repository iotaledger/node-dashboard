import { IAssociatedOutput } from "../../../models/tangle/IAssociatedOutputsResponse";

export interface TransactionPayloadState {
    /**
     * The outputs.
     */
    outputs: IAssociatedOutput[];

    /**
     * The current outputs page.
     */
    currentOutputsPage: number;

    /**
     * The outputs page size.
     */
    outputsPageSize: number;

    /**
     * The inputs with output details.
     */
    inputs: IAssociatedOutput[];

    /**
     * Is the inputs status busy.
     */
    statusInputsBusy: boolean;
}
