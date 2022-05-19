import { IGossipMetrics } from "@iota/iota.js";

export interface AnalyticsState {
    /**
     * The tabs to show.
     */
    tabs: string[];

    /**
     * The active tab.
     */
    activeTab: string;

    /**
     * Server gossip metrics.
     */
    gossipMetrics?: IGossipMetrics;

    /**
     * Last received bps time.
     */
    lastReceivedBpsTime: number;

    /**
     * The messages per second incoming.
     */
    bpsIncoming: number[];

    /**
     * The messages per second outgoing.
     */
    bpsOutgoing: number[];

    /**
     * First milestone received time.
     */
    averageMilestoneTime: number;

    /**
     * Last milestone received time.
     */
    lastMsReceivedTime: number;

    /**
     * The time between between milestones.
     */
    milestoneTiming: number[];

    /**
     * Messages per milestone.
     */
    bps: number[];

    /**
     * Referenced messages per milestone.
     */
    rbps: number[];

    /**
     * Last db size received time.
     */
    lastDbReceivedTime: number;

    /**
     * Last db interval time.
     */
    lastDbInterval: number;

    /**
     * Database size values for micro graph.
     */
    databaseSize: number[];

    /**
     * Last mem size received time.
     */
    lastStatusReceivedTime: number;

    /**
     * Last db interval time.
     */
    lastStatusInterval: number;

    /**
     * Memory size values for micro graph.
     */
    memorySize: number[];

    /**
     * Is the spammer available.
     */
    isSpammerAvailable: boolean;

    /**
     * Last spam avg received time.
     */
    lastSpamAvgReceivedTime: number;

    /**
     * Spam new blocks.
     */
    spamNewBlocks: number[];

    /**
     * Spam average blocks.
     */
    spamAvgBlocks: number[];

    /**
     * Last spam received time.
     */
    lastSpamReceivedTime: number;

    /**
     * Last spam interval time.
     */
    lastSpamInterval: number;

    /**
     * Last spam interval time.
     */
    lastSpamIntervals: number[];

    /**
     * Tip selection time.
     */
    tipSelection: number[];

    /**
     * Pow time.
     */
    pow: number[];

    /**
     * Received.
     */
    requestQueue: {
        queued: number[];
        pending: number[];
        processing: number[];
        averageLatency: number[];
    };

    /**
     * Memory.
     */
    memory: {
        stackAlloc: number[];
        heapReleased: number[];
        heapInUse: number[];
        heapIdle: number[];
        heapSys: number[];
        totalAlloc: number[];
    };

    /**
     * Caches.
     */
    caches: {
        requestQueue: number[];
        children: number[];
        milestones: number[];
        messages: number[];
        incomingMessageWorkUnits: number[];
    };
}
