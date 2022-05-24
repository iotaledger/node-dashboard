/* eslint-disable camelcase */
export interface INodeStatus {
    version: string;
    latestVersion: string;
    uptime: number;
    nodeId: string;
    nodeAlias: string;
    bech32_hrp: string;
    connectedPeersCount: number;
    currentRequestedMs: number;
    requestQueueQueued: number;
    requestQueuePending: number;
    requestQueueProcessing: number;
    requestQueueAvgLatency: number;
    serverMetrics: {
        allBlocks: number;
        newBlocks: number;
        knownBlocks: number;
        invalidBlocks: number;
        invalidRequests: number;
        receivedBlockRequests: number;
        receivedMilestoneRequests: number;
        receivedHeartbeats: number;
        sentBlocks: number;
        sentBlockRequests: number;
        sentMilestoneRequests: number;
        sentHeartbeats: number;
        droppedSentPackets: number;
        sentSpamBlocks: number;
    };
    mem: {
        sys: number;
        heapSys: number;
        heapInUse: number;
        heapIdle: number;
        heapReleased: number;
        heapObjects: number;
        mSpanInUse: number;
        mCacheInUse: number;
        stackSys: number;
        numGC: number;
        lastPauseGC: number;
    };
    caches: {
        requestQueue: {
            size: number;
        };
        children: {
            size: number;
        };
        milestones: {
            size: number;
        };
        blocks: {
            size: number;
        };
        incomingBlocksWorkUnits: {
            size: number;
        };
    };
}
