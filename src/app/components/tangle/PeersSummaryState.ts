export interface PeersSummaryState {
    /**
     * The list of peers.
     */
    peers?: {
        id: string;
        health: number;
        name: string;
        address?: string;
    }[];
}
