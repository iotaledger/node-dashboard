import { IPeerGossipMetrics } from "../../models/peers/IPeerGossipMetrics";

export interface PeerState {
    alias?: string;
    address: string;
    isConnected: boolean;
    receivedPacketsDiff: number[];
    sentPacketsDiff: number[];
    gossipMetrics?: IPeerGossipMetrics;
    relation: string;
    lastUpdateTime: number;

    /**
     * Hide any secure details.
     */
    blindMode: boolean;
}
