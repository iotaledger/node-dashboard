import { HexEncodedString } from "../hexEncodedTypes";
import type { ITypeBase } from "../ITypeBase";
/**
 * The global type for the payload.
 */
export declare const TAGGED_DATA_PAYLOAD_TYPE = 5;
/**
 * Tagged data payload.
 */
export interface ITaggedDataPayload extends ITypeBase<5> {
    /**
     * The tag to use to categorize the data.
     */
    tag: HexEncodedString;
}
