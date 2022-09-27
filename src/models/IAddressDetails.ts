import { BigInteger } from "big-integer";
import { IBech32AddressDetails } from "./IBech32AddressDetails";
/**
 * Address details.
 */
 export interface IAddressDetails extends IBech32AddressDetails {
    /**
     * The balance of the address.
     */
    balance?: number;

    /**
     * Nativ tokens.
     */
    nativeTokens?: {
        [id: string]: BigInteger;
    };

    /**
     * The ledger index at which these outputs where available at.
     */
    ledgerIndex?: number;
}
