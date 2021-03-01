import { IOutputResponse } from "@iota/iota.js";

export interface OutputProps {
    /**
     * The output id.
     */
    id: string;

    /**
     * The index within the parent.
     */
    index: number;

    /**
     * The output to display.
     */
    output: IOutputResponse;
}
