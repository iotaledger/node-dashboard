import { IBlock, IMilestonePayload } from "@iota/iota.js";

export interface IProofOfInclusion {
    /**
     * The block
     */
    block: IBlock;

    /**
     * The milestone
     */
    milestone: IMilestonePayload;

    /**
     * The proof
     */
    proof: Record<string, unknown>;
}
