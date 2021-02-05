import { IGossipMetrics } from "@iota/iota.js";

export interface PeerState {
    alias?: string;
    address: string;
    isConnected: boolean;
    isSynced: boolean;
    hasPeers: boolean;
    latestMilestoneIndex: string;
    latestSolidMilestoneIndex: string;
    pruningIndex: string;
    syncedPeers: string;
    connectedPeers: string;
    newMessagesDiff: number[];
    sentMessagesDiff: number[];
    gossipMetrics?: IGossipMetrics;
    relation: string;
    lastUpdateTime: number;
}
