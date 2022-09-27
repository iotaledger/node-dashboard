export interface IVisualizerVertex {
    /**
     * What is the id for the vertex.
     */
    fullId?: string;

    /**
     * What is the short id for the vertex.
     */
    shortId: string;

    /**
     * Parent Ids.
     */
    parents?: string;

    /**
     * Is the block solid.
     */
    isSolid?: boolean;

    /**
     * Is it a transaction.
     */
    isTransaction?: boolean;

    /**
     * Is the block conflicting.
     */
    isConflicting?: boolean;

    /**
     * Is the block referenced.
     */
    isReferenced?: boolean;

    /**
     * Is it a milestone.
     */
    isMilestone?: boolean;

    /**
     * Is it a tip.
     */
    isTip?: boolean;

    /**
     * Is it selected.
     */
    isSelected?: boolean;
}
