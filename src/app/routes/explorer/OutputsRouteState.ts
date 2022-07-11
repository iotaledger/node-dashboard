import { IAssociatedOutput } from "../../../models/tangle/IAssociatedOutputsResponse";

export interface OutputsRouteState {
    /**
     * The outputs.
     */
    outputs: IAssociatedOutput[];

    /**
     * Is the component status busy.
     */
    statusBusy: boolean;

    /**
     * The current page.
     */
    currentPage: number;

    /**
     * The page size.
     */
    pageSize: number;
}
