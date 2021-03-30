export interface ExplorerState {
    /**
     * Message per second.
     */
    mps: string;

    /**
     * Referenced messages per second.
     */
    rmps: string;

    /**
     * Referenced rate.
     */
    referencedRate: string;

    /**
     * The milestones.
     */
    milestones: {
        index: number;
        messageId: string;
    }[];
}
