import { ServiceFactory } from "../factories/serviceFactory";
import { TangleService } from "./tangleService";

/**
 * Service to handle getting confiuration from the node.
 */
export class NodeConfigService {
    /**
     * The network id.
     */
    private _networkId?: string;

    /**
     * The bech32 hrp.
     */
    private _bech32Hrp?: string;

    /**
     * Create a new instance of NodeConfigService.
     */
    constructor() {
        this._networkId = undefined;
        this._bech32Hrp = undefined;
    }

    /**
     * Initialise NodeConfigService.
     */
    public async initialize(): Promise<void> {
        if (!this._bech32Hrp || !this._networkId) {
            const tangleService = ServiceFactory.get<TangleService>("tangle");

            try {
                const info = await tangleService.info();
                this._bech32Hrp = info.bech32HRP;
                this._networkId = info.networkId;
            } catch {}
        }
    }

    /**
     * Get the hrp for bech32 addresses.
     * @returns The bech32 hrp.
     */
    public getBech32Hrp(): string {
        return this._bech32Hrp ?? "iota";
    }

    /**
     * Get the netwoork id.
     * @returns The network id.
     */
    public getNetworkId(): string {
        return this._networkId ?? "";
    }
}
