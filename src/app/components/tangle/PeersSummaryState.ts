export interface PeersSummaryState {
    /**
     * The list of peers.
     */
    peers?: {
        id: string;
        alias?: string;
        health: number;
        address?: string;
    }[];

    /**
     * Hide any secure details.
     */
    blindMode: boolean;
}
