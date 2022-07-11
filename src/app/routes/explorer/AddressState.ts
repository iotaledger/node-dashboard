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
     * The basic outputs for the address.
     */
    basicOutputs: IAssociatedOutput[];

    /**
     * The nft outputs for the address.
     */
    nftOutputs: IAssociatedOutput[];

    /**
     * The alias outputs for the address.
     */
    aliasOutputs: IAssociatedOutput[];

    /**
     * Nft output details.
     */
    nft?: IOutputResponse & { outputId: string };

    /**
     * Alias output details.
     */
    alias?: IOutputResponse & { outputId: string };

    /**
     * Is the basic outputs status busy.
     */
    statusBusyBasic: boolean;

    /**
     * Is the nft outputs status busy.
     */
    statusBusyNft: boolean;

    /**
     * Is the alias outputs status busy.
     */
    statusBusyAlias: boolean;
}
