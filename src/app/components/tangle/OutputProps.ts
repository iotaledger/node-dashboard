import { IOutputResponse, OutputTypes } from "@iota/iota.js";

export interface OutputProps {
    /**
     * The index within the parent.
     */
    index: number;

    /**
     * The output to display.
     */
    output: IOutputResponse | OutputTypes;
}
