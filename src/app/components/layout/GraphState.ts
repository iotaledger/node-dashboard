export interface GraphState {
    /**
     * Path to draw.
     */
    paths?: {
        path: string;
        className: string;
    }[];

    /**
     * Text to draw.
     */
    text?: {
        x: number;
        y: number;
        content: string;
    }[];
}
