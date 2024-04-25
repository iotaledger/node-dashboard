export interface IVerticesCounts {
    /**
     * How many vertices are there.
     */
    total: number;
    /**
     * How many accepted vertices.
     */
    accepted: number;
    /**
     * How many confirmed vertices.
     */
    confirmed: number;
    /**
     * How many finalized vertices.
     */
    finalized: number;
    /**
     * How many transaction vertices.
     */
    transactions: number;
    /**
     * How many tip vertices.
     */
    tips: number;
}
