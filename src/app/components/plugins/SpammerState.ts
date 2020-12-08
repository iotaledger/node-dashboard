
export interface SpammerState {
    /**
     * Plugin settings.
     */
    isRunning: boolean;

    /**
     * Spam messages per second.
     */
    mps: string;

    /**
     * Spam CPU utilization.
     */
    cpu: string;

    /**
     * Spam Workers.
     */
    workers: string;

    /**
     * Spam Workers max.
     */
    workersMax: number;
}
