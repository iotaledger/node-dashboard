export interface ExplorerState {
    /**
     * Message per second.
     */
    mps: string;

    /**
     * Confirmed messages per second.
     */
    cmps: string;

    /**
     * Confirmation rate.
     */
    confirmationRate: string;

    /**
     * The milestones.
     */
    milestones: {
        index: number;
        messageId: string;
    }[];
}
