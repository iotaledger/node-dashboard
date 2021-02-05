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
     * The interval between items in the graph.
     */
    timeInterval?: number;

    /**
     * The number of time markers to show.
     */
    timeMarkers?: number;

    /**
     * The end time.
     */
    endTime?: number;

    /**
     * The maximum number of items to show.
     */
    seriesMaxLength: number;

    /**
     * Class names.
     */
    className?: string;
}
