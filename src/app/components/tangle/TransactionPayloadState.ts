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
}
