/* eslint-disable @typescript-eslint/no-explicit-any */
import { IMessage, IMilestonePayload } from "@iota/iota.js";

export interface IPoi {
    /**
     * The version of the proof
     */
    version: number;

    /**
     * The milestone
     */
    milestone: IMilestonePayload;

    /**
     * The message
     */
    message: IMessage;

    /**
     * The proof
     */
    proof: any;
}
