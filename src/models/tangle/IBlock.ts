import { BlockBodyTypes } from "./blockBodyTypes";
import { IBlockHeader } from "./IBlockHeader";

/**
 * Block.
 */
export interface IBlock {
    header: IBlockHeader;
    body: BlockBodyTypes;
}
