export interface HealthIndicatorProps {
    /**
     * The label for the indicator.
     */
    label: string;

    /**
     * Is the indicator healthy.
     */
    healthy: boolean;

    /**
     * Class names.
     */
    className?: string;
}
