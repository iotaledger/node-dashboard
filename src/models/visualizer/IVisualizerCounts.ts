export interface IVisualizerCounts {
    /**
     * How many solid vertices.
     */
    solid: number;
    /**
     * How many referenced vertices.
     */
    referenced: number;
    /**
     * How many conflicting vertices.
     */
    conflicting: number;
    /**
     * How many tip vertices.
     */
    tips: number;
}
