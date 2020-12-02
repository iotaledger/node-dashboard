export interface SearchState {
    /**
     * Is the component busy.
     */
    statusBusy: boolean;

    /**
     * Is this an error.
     */
    error: string;

    /**
     * Redirect to another page.
     */
    redirect: string;
}
