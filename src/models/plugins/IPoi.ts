/* eslint-disable @typescript-eslint/no-explicit-any */
import { IBlock, IMilestonePayload } from "@iota/iota.js";

export interface IPoi {
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
    proof: any;
}
