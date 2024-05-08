
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
     * Current slot.
     */
    currentSlot?: string;

    /**
     * Current epoch.
     */
    currentEpoch?: string;

    /**
     * Latest accepted block slot.
     */
    latestAcceptedBlockSlot?: string;

    /**
     * Latest finalized slot.
     */
    latestFinalizedSlot?: string;

    /**
     * Latest committed slot.
     */
    latestCommitmentSlot?: string;

    /**
     * Blocks per second.
     */
    bps: string;

    /**
     * Referenced blocks per second.
     */
    rbps: string;

    /**
     * Referenced rate.
     */
    referencedRate: string;

    /**
     * The pruning epoch.
     */
    pruningEpoch?: string;

    /**
     * Uptime.
     */
    uptime?: string;

    /**
     * Memory usage.
     */
    memory?: string;

    /**
     * Permanent database size.
     */
    dbSizePermanentFormatted: string;

    /**
     * Prunable database size.
     */
    dbSizePrunableFormatted: string;

    /**
     * TxRetainer database size.
     */
    dbSizeTxRetainerFormatted: string;

    /**
     * Total database size.
     */
    dbSizeTotalFormatted: string;

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
