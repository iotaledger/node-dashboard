/**
 * Class to manage event aggregation.
 */
export class EventAggregator {
    /**
     * The stored subscriptions.
     */
    private static readonly _subscriptions: {
        [eventName: string]: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            [subscriberId: string]: (data: any) => void;
        };
    } = {};

    /**
     * Subscribe to an event.
     * @param eventName The name of the event to subscribe to.
     * @param subscriberId The id of the subscriber.
     * @param handler The handle to call on a publish.
     */
    public static subscribe(
        eventName: string,
        subscriberId: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: (data: any) => void | Promise<void>): void {
        EventAggregator._subscriptions[eventName] = EventAggregator._subscriptions[eventName] || {};
        EventAggregator._subscriptions[eventName][subscriberId] = handler;
    }

    /**
     * Unsubscribe from an event.
     * @param eventName The name of the event to subscribe to.
     * @param subscriberId The id of the subscriber.
     */
    public static unsubscribe(eventName: string, subscriberId: string): void {
        if (EventAggregator._subscriptions[eventName]) {
            delete EventAggregator._subscriptions[eventName][subscriberId];
        }
    }

    /**
     * Publish the event.
     * @param eventName The name of the event to publish.
     * @param data The data to publish with the event.
     */
    public static publish(eventName: string, data?: unknown): void {
        setTimeout(
            () => {
                if (EventAggregator._subscriptions[eventName]) {
                    for (const subscriberId in EventAggregator._subscriptions[eventName]) {
                        EventAggregator._subscriptions[eventName][subscriberId](data);
                    }
                }
            },
            0);
    }
}
