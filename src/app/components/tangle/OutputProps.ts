import { IOutputMetadataResponse, OutputTypes } from "@iota/iota.js";

export interface OutputProps {
    /**
     * The index within the parent.
     */
    index?: number;

    /**
     * The output metadata.
     */
    metadata?: IOutputMetadataResponse;

    /**
     * The output id.
     */
    outputId: string;

    /**
     * The output.
     */
    output: OutputTypes;

    /**
     * Expand output details.
     */
    showDetails?: boolean;
}
