
export interface HomeState {
    /**
     * The name or alias of the node.
     */
    nodeName?: string;

    /**
     * The node id.
     */
    nodeId?: string;

    /**
     * The version.
     */
    version?: string;

    /**
     * Latest version.
     */
    latestVersion?: string;

    /**
     * The version.
     */
    displayVersion?: string;

    /**
     * Latest version.
     */
    displayLatestVersion?: string;

    /**
     * Confirmed milestone index.
     */
    cmi?: string;

    /**
     * Latest milestone index.
     */
    lmi?: string;

    /**
     * The pruning index.
     */
    pruningIndex?: string;

    /**
     * Uptime.
     */
    uptime?: string;

    /**
     * Memory usage.
     */
    memory?: string;

    /**
     * Ledger database size.
     */
    dbLedgerSizeFormatted: string;

    /**
     * Tangle database size.
     */
    dbTangleSizeFormatted: string;

    /**
     * Last received bps time.
     */
    lastReceivedBpsTime: number;

    /**
     * The blocks per second incoming.
     */
    bpsIncoming: number[];

    /**
     * The blocks per second outgoing.
     */
    bpsOutgoing: number[];

    /**
     * The banner logo source.
     */
    bannerSrc: string;

    /**
     * Hide any details.
     */
    blindMode: boolean;
}
