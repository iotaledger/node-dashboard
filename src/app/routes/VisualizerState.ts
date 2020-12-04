import { IIndexationPayload, IMilestonePayload, ITransactionPayload } from "@iota/iota2.js";
import { IVisualizerVertex } from "../../models/visualizer/IVisualizerVertex";

export interface VisualizerState {
    /**
     * Messages.
     */
    total: string;

    /**
     * Messages per second.
     */
    mps: string;

    /**
     * Tips.
     */
    tips: string;

    /**
     * Referenced.
     */
    referenced: string;

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
        vertex: IVisualizerVertex;

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
        payload?: ITransactionPayload | IIndexationPayload | IMilestonePayload;
    };
}
