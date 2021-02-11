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
     * Mps for micro graph.
     */
    mps: string;

    /**
     * Mps values for micro graph.
     */
    mpsValues: number[];

    /**
     * Database size for micro graph.
     */
    databaseSizeFormatted: string;

    /**
     * Database size values for micro graph.
     */
    databaseSize: number[];

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
}
