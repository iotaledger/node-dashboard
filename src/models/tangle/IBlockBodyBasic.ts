import { ITypeBase } from "../ITypeBase";
import { PayloadTypes } from "./payloadTypes";

/**
 * Basic block body.
 */
export interface IBlockBodyBasic extends ITypeBase<0> {
    /**
     * The inner payload of the block. Can be nil.
     */
    payload: PayloadTypes | null;

    /**
     * The maximum amount of mana that can be burned in this block.
     */
    maxBurnedMana: number;
}
