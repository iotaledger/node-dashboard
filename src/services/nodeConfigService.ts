import { ServiceFactory } from "../factories/serviceFactory";
import { TangleService } from "./tangleService";

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
    }

    /**
     * Initialise NodeConfigService.
     */
    public async initialize(): Promise<void> {
        const tangleService = ServiceFactory.get<TangleService>("tangle");

        const info = await tangleService.info();
        this._bech32Hrp = info.bech32HRP;
    }

    /**
     * Get the hrp for bech32 addresses.
     * @returns The bech32 hrp.
     */
    public getBech32Hrp(): string {
        return this._bech32Hrp ?? "iota";
    }
}
