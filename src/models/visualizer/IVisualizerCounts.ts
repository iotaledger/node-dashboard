export interface IVisualizerCounts {
    /**
     * How many vertices are there.
     */
    total: number;
    /**
     * How many solid vertices.
     */
    solid: number;
    /**
     * How many referenced vertices.
     */
    referenced: number;
    /**
     * How many transaction vertices.
     */
    transactions: number;
    /**
     * How many conflicting vertices.
     */
    conflicting: number;
    /**
     * How many tip vertices.
     */
    tips: number;
}
