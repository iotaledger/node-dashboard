
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
     * Last received mps time.
     */
    lastReceivedMpsTime: number;

    /**
     * The messages per second incoming.
     */
    mpsIncoming: number[];

    /**
     * The messages per second outgoing.
     */
    mpsOutgoing: number[];

    /**
     * The banner logo source.
     */
    bannerSrc: string;

    /**
     * Hide any details.
     */
    blindMode: boolean;
}
