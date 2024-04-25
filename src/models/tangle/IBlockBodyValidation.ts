import { HexEncodedString } from "../hexEncodedTypes";
import type { ITypeBase } from "../ITypeBase";

/**
 * Validation block body.
 */
export interface IBlockBodyValidation extends ITypeBase<1> {
    /**
     * The highest version of the protocol that is supported by the validator.
     */
    highestSupportedVersion: number;

    /**
     * The hash of the protocol parameters for the HighestSupportedVersion.
     */
    protocolParametersHash: HexEncodedString;
}
