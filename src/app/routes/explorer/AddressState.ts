import { IOutputResponse } from "@iota/iota.js";
import { IAddressDetails } from "../../../models/IAddressDetails";
import { IBech32AddressDetails } from "../../../models/IBech32AddressDetails";

export interface AddressState {
    /**
     * Address.
     */
    address?: IAddressDetails;

    /**
     * The addres in bech 32 format.
     */
    bech32AddressDetails?: IBech32AddressDetails;

    /**
     * The address balance.
     */
    balance?: number;

    /**
     * Is the component status busy.
     */
    statusBusy: boolean;

    /**
     * The status.
     */
    status: string;

    /**
     * The output ids for the address.
     */
    outputIds?: string[];

    /**
     * The outputs for the address.
     */
    outputs?: IOutputResponse[];

    /**
     * Format the amount in full.
     */
    formatFull: boolean;

    /**
     * Show native tokens.
     */
    showTokens: boolean;

    /**
     * The current page.
     */
    currentPage: number;

    /**
     * The page size.
     */
    pageSize: number;
}
