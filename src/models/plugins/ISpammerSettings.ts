export interface ISpammerSettings {
    /**
     * Is the spammer running.
     */
    running: boolean;

    /**
     * The BPS Rate Limit.
     */
    bpsRateLimit: number;

    /**
     * Max cpu usage.
     */
    cpuMaxUsage: number;

    /**
     * Number of spam workers.
     */
    spammerWorkers: number;

    /**
     * The max number of spam workers.
     */
    spammerWorkersMax: number;
}
