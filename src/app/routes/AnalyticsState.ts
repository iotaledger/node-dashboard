export interface AnalyticsState {
    /**
     * The messages per second incoming.
     */
    mpsIncoming: number[];

    /**
     * The messages per second outgoing.
     */
    mpsOutgoing: number[];

    /**
     * The time between between milestones.
     */
    milestoneTiming: number[];

    /**
     * Messages per milestone.
     */
    mps: number[];

    /**
     * Confirmed messages per milestone.
     */
    cmps: number[];

    /**
     * Database size values for micro graph.
     */
    databaseSize: number[];

    /**
     * Memory size values for micro graph.
     */
    memorySize: number[];
}
