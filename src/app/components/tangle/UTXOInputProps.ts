import { IUTXOInput } from "@iota/iota.js";
import { IBech32AddressDetails } from "../../../models/IBech32AddressDetails";

export interface UTXOInputProps {
    /**
     * The index within the parent.
     */
    index: number;

    /**
     * The unlock address for the transactions.
     */
    unlockAddress: IBech32AddressDetails;

    /**
     * The input to display.
     */
    input: IUTXOInput;
}
