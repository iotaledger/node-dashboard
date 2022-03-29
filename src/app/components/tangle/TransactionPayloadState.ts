import { IBech32AddressDetails } from "../../../models/IBech32AddressDetails";

export interface TransactionPayloadState {

    /**
     * The unlock addresses for the transactions.
     */
    unlockAddresses: IBech32AddressDetails[];
}
