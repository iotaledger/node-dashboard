export interface HeaderState {
    /**
     * The node health.
     */
    isNodeHealthy: boolean;

    /**
     * The network health.
     */
    isNetworkHealthy: boolean;

    /**
     * Bps for micro graph.
     */
    bps: string;

    /**
     * Bps values for micro graph.
     */
    bpsValues: number[];

    /**
     * Total database size for micro graph.
     */
    dbSizeTotalFormatted: string;

    /**
     * Total database size values for micro graph.
     */
    dbSizeTotal: number[];

    /**
     * Memory size for micro graph.
     */
    memorySizeFormatted: string;

    /**
     * Memory size values for micro graph.
     */
    memorySize: number[];

    /**
     * Is the auth logged in.
     */
    isLoggedIn: boolean;

    /**
     * Is the app online.
     */
    online: boolean;
}
