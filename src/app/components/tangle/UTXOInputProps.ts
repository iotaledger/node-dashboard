import { AddressTypes, IUTXOInput } from "@iota/iota.js";

export interface UTXOInputProps {
    /**
     * The index within the parent.
     */
    index: number;

    /**
     * The unlock address for the transactions.
     */
    unlockAddress: AddressTypes;

    /**
     * The input to display.
     */
    input: IUTXOInput;
}
