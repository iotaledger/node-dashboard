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
        lastUpdateTime: number;
    }[];

    /**
     * The type of dialog to show.
     */
    dialogType?: "add" | "delete";

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
}
