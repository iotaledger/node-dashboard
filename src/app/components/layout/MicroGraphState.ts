export interface MicroGraphState {
    /**
     * Graph points.
     */
    graphPoints?: {
        type: string;
        x: number;
        y: number;
    }[];

    /**
     * Circle position.
     */
    circle?: {
        x: number;
        y: number;
    };
}
