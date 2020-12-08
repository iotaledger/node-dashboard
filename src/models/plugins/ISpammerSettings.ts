export interface ISpammerSettings {
    /**
     * Is the spammer running.
     */
    running: boolean;

    /**
     * The MPS Rate Limit.
     */
    mpsRateLimit: number;

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
