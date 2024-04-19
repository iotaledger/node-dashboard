import type { ITypeBase } from "../ITypeBase";
/**
 * The global type for the payload.
 */
export declare const TRANSACTION_PAYLOAD_TYPE = 6;
/**
 * Transaction payload.
 */
export interface ITransactionPayload extends ITypeBase<6> {
    /**
     * The balance on the input side.
     */
    amount: number;
}
