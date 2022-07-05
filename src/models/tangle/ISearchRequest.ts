export interface ISearchRequest {
    /**
     * The query to look for.
     */
    query: string;

    /**
     * The query to look for.
     */
    pageSize?: number;

    /**
     * A cursor to use if reading the next page of results.
     */
    cursor?: string;
}
