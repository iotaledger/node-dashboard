import { IBlockBodyBasic } from "./IBlockBodyBasic";
import { IBlockBodyValidation } from "./IBlockBodyValidation";

/**
 * The global types for the block bodies.
 */
export const BLOCK_BODY_TYPE_BASIC = 0;
export const BLOCK_BODY_TYPE_VALIDATION = 1;

/**
 * All of the block body types.
 */
export declare type BlockBodyTypes = IBlockBodyBasic | IBlockBodyValidation;
