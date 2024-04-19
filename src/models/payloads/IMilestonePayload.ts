import type { ITypeBase } from "../ITypeBase";
/**
 * The global type for the payload.
 */
export declare const MILESTONE_PAYLOAD_TYPE = 7;
/**
 * Milestone payload.
 */
export interface IMilestonePayload extends ITypeBase<7> {
    /**
     * The index name.
     */
    index: number;
    /**
     * The timestamp of the milestone.
     */
    timestamp: number;
}
