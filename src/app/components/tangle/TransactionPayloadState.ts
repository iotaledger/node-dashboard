import { AddressTypes } from "@iota/iota.js";

export interface TransactionPayloadState {
    /**
     * The unlock addresses for the transactions.
     */
    unlockAddresses: AddressTypes[];

    /**
     * The transaction id.
     */
    transactionId: string;

    /**
     * The current outputs page.
     */
    currentOutputsPage: number;

    /**
     * The outputs page size.
     */
    outputsPageSize: number;

    /**
     * The current inputs page.
     */
    currentInputsPage: number;

    /**
     * The inputs page size.
     */
    inputsPageSize: number;
}
