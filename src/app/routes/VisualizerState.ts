import { IMilestonePayload } from "../../models/payloads/IMilestonePayload";
import { ITaggedDataPayload } from "../../models/payloads/ITaggedDataPayload";
import { ITransactionPayload } from "../../models/payloads/ITransactionPayload";
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
     * Referenced.
     */
    referenced: string;

    /**
     * Transactions.
     */
    transactions: string;

    /**
     * Conflicting.
     */
    conflicting: string;

    /**
     * Solid.
     */
    solid: string;

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
         * Select item state.
         */
        state: string;

        /**
         * Select item title.
         */
        title?: string;

        /**
         * Select item payload.
         */
        payload?: ITransactionPayload | ITaggedDataPayload | IMilestonePayload;
    };

    /**
     * What is the theme.
     */
    theme: string;
}
