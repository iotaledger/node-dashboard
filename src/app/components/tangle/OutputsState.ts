import { OutputTypes } from "@iota/iota.js";
import { IAssociatedOutput } from "../../../models/tangle/IAssociatedOutputsResponse";

export interface OutputsState {
    /**
     * The current page.
     */
    currentPage: number;

    /**
     * The outputs to display.
     */
    outputs: OutputTypes[] | IAssociatedOutput[];
}
