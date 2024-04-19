import type { IPeerGossipMetrics } from "./IPeerGossipMetrics";

/**
 * Peer details.
 */
export interface IPeer {
    /**
     * The libp2p identifier of the peer.
     */
    id: string;
    /**
     * The libp2p multi addresses of the peer.
     */
    multiAddresses: string[];
    /**
     * The alias to identify the peer.
     */
    alias?: string;
    /**
     * The relation (manual, autopeered) of the peer.
     */
    relation: string;
    /**
     * Whether the peer is connected.
     */
    connected: boolean;
    /**
     * The gossip metrics for this peer.
     */
    gossipMetrics: IPeerGossipMetrics;
}
