import { IOutputResponse, OutputTypes } from "@iota/iota.js";

export enum AssociationType {
    BASIC_OUTPUT,
    BASIC_SENDER,
    BASIC_EXPIRATION_RETURN,
    BASIC_STORAGE_RETURN,
    ALIAS_STATE_CONTROLLER,
    ALIAS_GOVERNOR,
    ALIAS_ISSUER,
    ALIAS_SENDER,
    FOUNDRY_ALIAS,
    NFT_OUTPUT,
    NFT_STORAGE_RETURN,
    NFT_EXPIRATION_RETURN,
    NFT_SENDER,
    TAG
}

export interface IAssociatedOutput {
    association?: AssociationType;
    outputId: string;
    outputDetails?: IOutputResponse;
    outputType?: OutputTypes;
}

export interface IAssociatedOutputsResponse {
    /**
     * The associated outputs.
     */
    outputs?: IAssociatedOutput[];
}
