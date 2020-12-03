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
     * Parent 1 Id.
     */
    parent1Id?: string;

    /**
     * Parent 2 Id.
     */
    parent2Id?: string;

    /**
     * Is the message solid.
     */
    isSolid?: boolean;

    /**
     * Is the message conflicting.
     */
    isConflicting?: boolean;

    /**
     * Is the message referenced.
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
