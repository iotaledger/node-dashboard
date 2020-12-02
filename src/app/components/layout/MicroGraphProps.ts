export interface MicroGraphProps {
    /**
     * The label for the micro graph.
     */
    label: string;

    /**
     * The value for the micro graph.
     */
    value: string;

    /**
     * The graph values.
     */
    values: number[];

    /**
     * Class names.
     */
    className?: string;

    /**
     * Width for the graph.
     */
    graphWidth?: number;

    /**
     * Height for the graph.
     */
    graphHeight?: number;
}
