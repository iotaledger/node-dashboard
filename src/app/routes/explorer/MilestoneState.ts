import { IMilestonePayload } from "@iota/iota.js";

export interface MilestoneState {
    /**
     * Milestone.
     */
    milestone?: IMilestonePayload;

    /**
     * The message id of the milestone.
     */
    messageId?: string;

    /**
     * The previous milestone is available.
     */
    previousIndex: number;

    /**
     * The next milestone is available.
     */
    nextIndex: number;

    /**
     * The previous milestone is available.
     */
    hasPrevious: boolean;

    /**
     * The next milestone is available.
     */
    hasNext: boolean;
}
