export interface HeaderState {
    /**
     * The sync health.
     */
    syncHealth: boolean;

    /**
     * The node health.
     */
    nodeHealth: boolean;

    /**
     * Bps for micro graph.
     */
    bps: string;

    /**
     * Bps values for micro graph.
     */
    bpsValues: number[];

    /**
     * Ledger database size for micro graph.
     */
    dbLedgerSizeFormatted: string;

    /**
     * Ledger database size values for micro graph.
     */
    dbLedgerSize: number[];

    /**
     * Tangle db size for micro graph.
     */
    dbTangleSizeFormatted: string;

    /**
     * Tangle db size values for micro graph.
     */
    dbTangleSize: number[];

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
