export interface PeersState {
    /**
     * The peers.
     */
    peers: {
        id: string;
        alias?: string;
        address?: string;
        originalAddress?: string;
        health: number;
        relation: string;
        newMessagesTotal: number[];
        sentMessagesTotal: number[];
        newMessagesDiff: number[];
        sentMessagesDiff: number[];
        lastUpdateTime: number;
    }[];

    /**
     * The type of dialog to show.
     */
    dialogType?: "add" | "delete" | "promote";

    /**
     * The peer to operate on.
     */
    dialogPeerId?: string;

    /**
     * Is the dialog busy.
     */
    dialogBusy?: boolean;

    /**
     * Status message to display in dialog.
     */
    dialogStatus?: string;

    /**
     * Address for adding a peer.
     */
    peerAddress: string;

    /**
     * Alias for adding a peer.
     */
    peerAlias: string;

    /**
     * Hide any secure details.
     */
    blindMode: boolean;
}
