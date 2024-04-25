import { IBlock } from "../../models/tangle/IBlock";
import { IVertex } from "../../models/visualizer/IVertex";

export interface VisualizerState {
    /**
     * Blocks.
     */
    total: string;

    /**
     * Blocks per second.
     */
    bps: string;

    /**
     * Tips.
     */
    tips: string;

    /**
     * Accepted.
     */
    accepted: string;

    /**
     * Confirmed.
     */
    confirmed: string;

    /**
     * Finalized.
     */
    finalized: string;

    /**
     * Transactions.
     */
    transactions: string;

    /**
     * Is the rendering active.
     */
    isActive: boolean;

    /**
     * The vertex that is selected.
     */
    selected?: {
        /**
         * The vertex that is selected.
         */
        vertex: IVertex;

        /**
         * Select item vertex state.
         */
        vertexState: string;

        /**
         * Select item block state title.
         */
        blockStateTitle?: string;

        /**
         * Select item payload title.
         */
        payloadTitle?: string;

        /**
         * Select item block.
         */
        block?: IBlock;
    };

    /**
     * What is the theme.
     */
    theme: string;
}
