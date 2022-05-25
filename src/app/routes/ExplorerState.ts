export interface ExplorerState {
    /**
     * Blocks per second.
     */
    bps: string;

    /**
     * Referenced blocks per second.
     */
    rbps: string;

    /**
     * Referenced rate.
     */
    referencedRate: string;

    /**
     * The milestones.
     */
    milestones: {
        milestoneId: string;
        index: number;
    }[];
}
