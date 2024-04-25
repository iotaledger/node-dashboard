import { HexEncodedString } from "../hexEncodedTypes";
import type { ITypeBase } from "../ITypeBase";

/**
 * Tagged data payload.
 */
export interface IPayloadTaggedData extends ITypeBase<0> {
    /**
     * The tag to use to categorize the data.
     */
    tag: HexEncodedString;
}
