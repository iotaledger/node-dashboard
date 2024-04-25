import { HexEncodedString } from "../hexEncodedTypes";

/**
 * Block Header.
 */
export interface IBlockHeader {
    /**
     * The ID of the issuer.
     */
    issuerId: HexEncodedString;
}
