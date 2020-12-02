export interface GraphProps {
    /**
     * The caption for the graph.
     */
    caption: string;

    /**
     * The graph series.
     */
    series: {
        className: string;
        label: string;
        values: number[];
    }[];

    /**
     * The maximum number of items to show.
     */
    seriesMaxLength: number;

    /**
     * Class names.
     */
    className?: string;
}
