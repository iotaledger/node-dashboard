import { IAssociatedOutput } from "../../../models/tangle/IAssociatedOutputsResponse";

export interface OutputsProps {
    /**
     * The associated outputs to display.
     */
    outputs: IAssociatedOutput[];

    /**
     * The current page.
     */
    currentPage: number;

    /**
     * Number of results per page.
     */
    pageSize: number;

    /**
     * The total number of sibling pages.
     */
    siblingsCount: number;

    /**
     * Define limit of remaining pages above which the extra page range will be shown.
     */
    extraPageRangeLimit?: number;

    /**
     * Is the component status busy.
     */
    statusBusy?: boolean;

    /**
     * The header title.
     */
    title: string;

    /**
     * Page changed.
     * @param page Page navigated to.
     * @param firstPageIndex The index of the first item on the page.
     * @param lastPageIndex The index on the last item on the page.
     */
    onPageChange?(page: number, firstPageIndex: number, lastPageIndex: number): void;
}
