export interface PeersSummaryState {
    /**
     * The list of peers.
     */
    peers?: {
        health: number;
        name: string;
        address?: string;
    }[];
}
