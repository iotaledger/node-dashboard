export interface PeersState {
    /**
     * The peers.
     */
    peers: {
        name: string;
        address?: string;
        connected: boolean;
        incoming: number[];
        outgoing: number[];
    }[];
}
