export interface FeatureState {
    /**
     * Shows details of the feature condition
     */
    showDetails: boolean;

    /**
     * Hex view of data.
     */
    hexData?: string;

    /**
     * UTF8 view of data.
     */
    utf8Data?: string;

    /**
     * JSON view of data.
     */
    jsonData?: string;
}
