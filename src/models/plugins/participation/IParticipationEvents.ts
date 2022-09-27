export interface IParticipationEvents {
    /**
     * The hex encoded IDs of the found events.
     */
    eventIds: string[];

    /**
     * The error message.
     */
    error?: {
        message: string;
    };
}
