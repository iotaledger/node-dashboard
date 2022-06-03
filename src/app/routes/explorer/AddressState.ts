import { IOutputResponse } from "@iota/iota.js";
import { IAddressDetails } from "../../../models/IAddressDetails";

export interface AddressState {
    /**
     * Address.
     */
    address?: IAddressDetails;

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
