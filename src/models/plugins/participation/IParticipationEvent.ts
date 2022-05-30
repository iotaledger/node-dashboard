export interface IParticipationEvent {
    /**
     * The hex encoded ID of the created participation event.
     */
    eventId: string;

    /**
     * The error message.
     */
    error?: {
        message: string;
    };
}
