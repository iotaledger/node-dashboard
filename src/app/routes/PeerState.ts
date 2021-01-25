import { IGossipMetrics } from "@iota/iota.js";

export interface PeerState {
    name: string;
    address: string;
    isConnected: boolean;
    isSynced: boolean;
    hasNeighbors: boolean;
    latestMilestoneIndex: string;
    latestSolidMilestoneIndex: string;
    pruningIndex: string;
    syncedNeighbors: string;
    connectedNeighbors: string;
    newMessagesDiff: number[];
    sentMessagesDiff: number[];
    gossipMetrics?: IGossipMetrics;
}
