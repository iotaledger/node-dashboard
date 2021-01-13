import { ServiceFactory } from "../factories/serviceFactory";
import { IStatus } from "../models/websocket/IStatus";
import { WebSocketTopic } from "../models/websocket/webSocketTopic";
import { MetricsService } from "./metricsService";

/**
 * Service to handle getting confiuration from the node.
 */
export class NodeConfigService {
    /**
     * The bech32 hrp.
     */
    private _bech32Hrp?: string;

    /**
     * Create a new instance of NodeConfigService.
     */
    constructor() {
        this._bech32Hrp = undefined;
        const metricsService = ServiceFactory.get<MetricsService>("metrics");

        const subscriptionId = metricsService.subscribe<IStatus>(
            WebSocketTopic.Status,
            data => {
                if (data?.bech32_hrp) {
                    this._bech32Hrp = data.bech32_hrp;
                    metricsService.unsubscribe(subscriptionId);
                }
            });
    }

    /**
     * Get the hrp for bech32 addresses.
     * @returns The bech32 hrp.
     */
    public getBech32Hrp(): string {
        return this._bech32Hrp ?? "iota";
    }
}
