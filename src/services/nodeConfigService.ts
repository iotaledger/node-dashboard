import { ServiceFactory } from "../factories/serviceFactory";
import { SessionStorageService } from "./sessionStorageService";
import { TangleService } from "./tangleService";

/**
 * Service to handle getting confiuration from the node.
 */
export class NodeConfigService {
    /**
     * The network id.
     */
    private _networkId: string;

    /**
     * The storage servie.
     */
    private readonly _storageService: SessionStorageService;

    /**
     * Create a new instance of NodeConfigService.
     */
    constructor() {
        this._storageService = ServiceFactory.get<SessionStorageService>("session-storage");
        this._networkId = "";
    }

    /**
     * Initialise NodeConfigService.
     */
    public async initialize(): Promise<void> {
        this._networkId = this._storageService.load<string>("networkId");

        if (!this._networkId) {
            const tangleService = ServiceFactory.get<TangleService>("tangle");

            try {
                const info = await tangleService.info();
                this.setNetworkId(info.protocol.networkName);
            } catch {}
        }
    }

    /**
     * Get the netwoork id.
     * @returns The network id.
     */
    public getNetworkId(): string {
        return this._networkId;
    }

    /**
     * Set the network id.
     * @param networkId The new blind mode.
     */
    public setNetworkId(networkId: string): void {
        this._networkId = networkId;
        this._storageService.save<string>("networkId", this._networkId);
    }
}
