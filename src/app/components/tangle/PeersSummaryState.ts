export interface PeersSummaryState {
    /**
     * The list of peers.
     */
    peers?: {
        connected: boolean;
        name: string;
        address?: string;
    }[];
}
