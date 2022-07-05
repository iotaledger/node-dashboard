import { IMilestonePayload, IBlock, IOutputResponse } from "@iota/iota.js";
import { IAddressDetails } from "../IAddressDetails";

export interface ISearchResponse {
    /**
     * Block if it was found.
     */
    block?: IBlock;

    /**
     * Block ids if indexation was found.
     */
    indexBlockIds?: string[];

    /**
     * Index type if result from indexation.
     */
    indexBlockType?: "utf8" | "hex" | undefined;

    /**
     * Address if it was found.
     */
    address?: IAddressDetails;

    /**
     * Output ids when address was found.
     */
    addressOutputIds?: string[];

    /**
     * Output id if it waas found.
     */
    outputId?: string;

    /**
     * Output if it was found (block will also be populated).
     */
    output?: IOutputResponse;

    /**
     * Output ids array.
     */
    outputs?: string[];

    /**
     * Milestone if it was found.
     */
    milestone?: IMilestonePayload;

    /**
     * Cursor for next page.
     */
    cursor?: string;
}
