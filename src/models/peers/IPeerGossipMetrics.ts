/**
 * Peer Gossip metrics.
 */
export interface IPeerGossipMetrics {
    /**
     * The total amount of received packets.
     */
    packetsReceived: number;
    /**
     * The total amount of sent packets.
     */
    packetsSent: number;
}
