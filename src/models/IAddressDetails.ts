import { BigInteger } from "big-integer";
/**
 * Address details.
 */
 export interface IAddressDetails {
    /**
     * The address the details are for.
     */
    address?: string;

    /**
     * The balance of the address.
     */
    balance: number;

    /**
     * Nativ tokens.
     */
    nativeTokens:  {
        [id: string]: BigInteger;
    };

    /**
     * The ledger index at which these outputs where available at.
     */
    ledgerIndex: number;
}
