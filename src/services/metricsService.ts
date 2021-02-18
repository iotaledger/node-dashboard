import { Converter, RandomHelper } from "@iota/iota.js";
import { ServiceFactory } from "../factories/serviceFactory";
import { WebSocketTopic } from "../models/websocket/webSocketTopic";
import { WebSocketService } from "../services/webSocketService";

/**
 * Service to handle the websocket connection.
 */
export class MetricsService {
    /**
     * The web socket service.
     */
    private readonly _webSocketService: WebSocketService;

    /**
     * The web socket subscriptions.
     */
    private _webSocketSubscriptions: string[];

    /**
     * The cached data.
     */
    private _cached: {
        [topic: number]: unknown[];
    };

    /**
     * Subscribers to the messages.
     */
    private readonly _subscriptions: {
        [topic: number]: {
            subscriptionId: string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            singleCallback?: (data: any) => void;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            multipleCallback?: (data: any[]) => void;
        }[];
    };

    /**
     * Create a new instance of MetricsService.
     */
    constructor() {
        this._webSocketService = ServiceFactory.get<WebSocketService>("web-socket");
        this._webSocketSubscriptions = [];
        this._subscriptions = {};
        this._cached = {};
    }

    /**
     * Initialise the service.
     */
    public initialize(): void {
        const topics: { topic: WebSocketTopic; isPublic: boolean }[] = [
            { topic: WebSocketTopic.SyncStatus, isPublic: true },
            { topic: WebSocketTopic.NodeStatus, isPublic: false },
            { topic: WebSocketTopic.PublicNodeStatus, isPublic: true },
            { topic: WebSocketTopic.MPSMetrics, isPublic: true },
            { topic: WebSocketTopic.DBSizeMetric, isPublic: false },
            { topic: WebSocketTopic.PeerMetric, isPublic: false },
            { topic: WebSocketTopic.Ms, isPublic: true },
            { topic: WebSocketTopic.ConfirmedMsMetrics, isPublic: true },
            { topic: WebSocketTopic.TipInfo, isPublic: true },
            { topic: WebSocketTopic.MilestoneInfo, isPublic: true },
            { topic: WebSocketTopic.ConfirmedInfo, isPublic: true },
            { topic: WebSocketTopic.SolidInfo, isPublic: true },
            { topic: WebSocketTopic.Vertex, isPublic: true },
            { topic: WebSocketTopic.SpamMetrics, isPublic: false },
            { topic: WebSocketTopic.AvgSpamMetrics, isPublic: false }
        ];

        for (const t of topics) {
            this._webSocketSubscriptions.push(
                this._webSocketService.subscribe(
                    t.topic,
                    !t.isPublic,
                    data => {
                        this.triggerCallbacks(t.topic, data);
                    }));
        }
    }

    /**
     * Closedown the service.
     */
    public closedown(): void {
        for (let i = 0; i < this._webSocketSubscriptions.length; i++) {
            this._webSocketService.unsubscribe(this._webSocketSubscriptions[i]);
        }
        this._webSocketSubscriptions = [];
    }

    /**
     * Subscribe to a topic.
     * @param topic The topic to subscribe to.
     * @param singleCallback The callback to send the data to.
     * @param multipleCallback The callback to send the data to.
     * @returns The subscription id.
     */
    public subscribe<T>(
        topic: WebSocketTopic,
        singleCallback?: (data: T) => void, multipleCallback?: (dataAll: T[]) => void): string {
        if (!this._subscriptions[topic]) {
            this._subscriptions[topic] = [];
        }

        const subscriptionId = Converter.bytesToHex(RandomHelper.generate(32));

        this._subscriptions[topic].push({
            subscriptionId,
            singleCallback,
            multipleCallback
        });

        if (this._cached[topic] && this._cached[topic].length > 0) {
            if (multipleCallback) {
                multipleCallback(this._cached[topic] as T[]);
            }
            if (singleCallback) {
                singleCallback((this._cached[topic][this._cached[topic].length - 1] as T));
            }
        }

        return subscriptionId;
    }

    /**
     * Unsubscribe from a topic.
     * @param subscriptionId The subscription to unsubscribe.
     */
    public unsubscribe(subscriptionId: string): void {
        for (const topic of Object.keys(this._subscriptions).map(k => Number(k))) {
            const subscriptionIdx = this._subscriptions[topic].findIndex(s => s.subscriptionId === subscriptionId);
            if (subscriptionIdx >= 0) {
                this._subscriptions[topic].splice(subscriptionIdx, 1);

                if (this._subscriptions[topic].length === 0) {
                    delete this._subscriptions[topic];
                    break;
                }
            }
        }
    }

    /**
     * Trigger the callback handlers for the subscribers.
     * @param topic The message topic.
     * @param data The message data.
     */
    private triggerCallbacks(topic: WebSocketTopic, data: unknown): void {
        if (!this._cached[topic]) {
            this._cached[topic] = [];
        }
        if (topic === WebSocketTopic.DBSizeMetric || topic === WebSocketTopic.ConfirmedMsMetrics) {
            if (Array.isArray(data)) {
                this._cached[topic].push(...data as unknown[]);
            } else {
                this._cached[topic].push(data);
            }
        } else {
            this._cached[topic].push(data);
        }
        this._cached[topic] = this._cached[topic].slice(-60);

        if (this._subscriptions[topic]) {
            for (const subscriber of this._subscriptions[topic]) {
                if (subscriber.singleCallback) {
                    subscriber.singleCallback(this._cached[topic][this._cached[topic].length - 1]);
                }
                if (subscriber.multipleCallback) {
                    subscriber.multipleCallback(this._cached[topic]);
                }
            }
        }
    }
}
