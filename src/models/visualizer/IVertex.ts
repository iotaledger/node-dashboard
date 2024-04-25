export interface IVertex {
    /**
     * What is the id for the vertex.
     */
    fullId?: string;

    /**
     * What is the short id for the vertex.
     */
    shortId: string;

    /**
     * Slot of the block.
     */
    slot?: number;

    /**
     * Parent Ids.
     */
    parents?: string;

    /**
     * Block State.
     */
    blockState?: string;

    /**
     * Is the block a basic block tagged data.
     */
    isBasicBlockTaggedData?: boolean;

    /**
     * Is the block a basic block signed transaction.
     */
    isBasicBlockSignedTransaction?: boolean;

    /**
     * Is the block a basic block candidacy announcement.
     */
    isBasicBlockCandidacyAnnouncement?: boolean;

    /**
     * Is the block a validation block.
     */
    isValidationBlock?: boolean;

    /**
     * Is the block a tip.
     */
    isTip?: boolean;

    /**
     * Is the block accepted.
     */
    isAccepted?: boolean;

    /**
     * Is the block confirmed.
     */
    isConfirmed?: boolean;

    /**
     * Is the block finalized.
     */
    isFinalized?: boolean;

    /**
     * Is it selected.
     */
    isSelected?: boolean;
}
