export interface PeersSummaryState {
    /**
     * The list of peers.
     */
    peers?: {
        id: string;
        alias?: string;
        connected: boolean;
        address?: string;
    }[];

    /**
     * Hide any secure details.
     */
    blindMode: boolean;
}
