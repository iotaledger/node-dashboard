export interface PeersState {
    /**
     * The peers.
     */
    peers: {
        name: string;
        id: string;
        address?: string;
        health: number;
        newMessagesTotal: number[];
        sentMessagesTotal: number[];
        newMessagesDiff: number[];
        sentMessagesDiff: number[];
    }[];
}
