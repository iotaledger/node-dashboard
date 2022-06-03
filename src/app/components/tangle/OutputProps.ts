import { IOutputResponse, OutputTypes } from "@iota/iota.js";

export interface OutputProps {
    /**
     * The index within the parent.
     */
    index?: number;

    /**
     * The output id.
     */
    outputId: string;

    /**
     * The output to display.
     */
    output: IOutputResponse | OutputTypes;

    /**
     * Expand output details.
     */
    showDetails?: boolean;
}
