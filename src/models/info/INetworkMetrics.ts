/**
 * Response from the /info endpoint.
 */
export interface INetworkMetrics {
    /**
     * Current rate of new blocks per second, it's updated when a commitment is committed.
     */
    blocksPerSecond: string;
    /**
     * Current rate of confirmed blocks per second, it's updated when a commitment is committed.
     */
    confirmedBlocksPerSecond: string;
    /**
     * Ratio of confirmed blocks in relation to new blocks up until the latest commitment is committed.
     */
    confirmationRate: string;
}
