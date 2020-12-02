export interface IWebSocketMessage {
    /**
     * The type of the message.
     */
    type: number;

    /**
     * The data for the message.
     */
    data: unknown;
}
