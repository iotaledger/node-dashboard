import { IOutputResponse } from "@iota/iota.js";

export interface OutputProps {
    /**
     * The output id.
     */
    id: string;

    /**
     * The output to display.
     */
    output: IOutputResponse;
}
