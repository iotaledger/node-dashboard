import { IOutputResponse } from "@iota/iota.js";
import { IAddressDetails } from "../../../models/IAddressDetails";
import { IAssociatedOutput } from "../../../models/tangle/IAssociatedOutputsResponse";

export interface AddressState {
    /**
     * Address.
     */
    address?: IAddressDetails;

    /**
     * The outputs for the address.
     */
    outputs: IAssociatedOutput[];

    /**
     * Nft output details.
     */
    nft?: IOutputResponse & { outputId: string };

    /**
     * Alias output details.
     */
    alias?: IOutputResponse & { outputId: string };

    /**
     * Is the component status busy.
     */
    statusBusy: boolean;

    /**
     * The status.
     */
    status: string;

    /**
     * The current page.
     */
    currentPage: number;

    /**
     * The page size.
     */
    pageSize: number;
}
