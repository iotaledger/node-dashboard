import { IMigratedFunds } from "@iota/iota.js";

export interface MigratedFundProps {
    /**
     * The index within the parent.
     */
    index: number;

    /**
     * The migrated fund.
     */
    fund: IMigratedFunds;
}
