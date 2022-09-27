
export interface SpammerState {
    /**
     * Plugin settings.
     */
    isRunning: boolean;

    /**
     * Spam blocks per second.
     */
    bps: string;

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

    /**
     * Is value spamming enabled.
     */
    valueSpamEnabled: boolean;
}
