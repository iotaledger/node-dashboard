import { AddressTypes } from "@iota/iota.js";
import { IBech32AddressDetails } from "../../../models/IBech32AddressDetails";

export interface Bech32AddressProps {
    /**
     * Active links.
     */
    activeLinks: boolean;

    /**
     * Show Hexadecimal address representation.
     */
    showHexAddress: boolean;

    /**
     * The address.
     */
    address?: AddressTypes;

    /**
     * The address.
     */
    addressDetails?: IBech32AddressDetails;
}
