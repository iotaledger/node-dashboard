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
    newBlocksDiff: number[];
    sentBlocksDiff: number[];
    gossipMetrics?: IGossipMetrics;
    relation: string;
    lastUpdateTime: number;

    /**
     * Hide any secure details.
     */
    blindMode: boolean;

    /**
     * Confirmed milestone index of the node.
     */
    nodeCmi?: number;

    /**
     * Latest milestone index of the node.
     */
    nodeLmi?: number;
}
