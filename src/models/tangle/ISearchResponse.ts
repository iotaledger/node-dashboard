import { IMilestonePayload, IMessage, IOutputResponse } from "@iota/iota.js";
import { IAddressDetails } from "../IAddressDetails";

export interface ISearchResponse {
    /**
     * Message if it was found.
     */
    message?: IMessage;

    /**
     * Message ids if indexation was found.
     */
    indexMessageIds?: string[];

    /**
     * Index type if result from indexation.
     */
    indexMessageType?: "utf8" | "hex" | undefined;

    /**
     * Address if it was found.
     */
    address?: IAddressDetails;

    /**
     * Output ids when address was found.
     */
    addressOutputIds?: string[];

    /**
     * Output if it was found (message will also be populated).
     */
    output?: IOutputResponse;

    /**
     * Milestone if it was found.
     */
    milestone?: IMilestonePayload;
}
