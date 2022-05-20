import { INativeToken } from "@iota/iota.js";

export interface TokenProps {
    /**
     * The index within the parent.
     */
    index: number;

    /**
     * The token.
     */
    token: INativeToken;
}
