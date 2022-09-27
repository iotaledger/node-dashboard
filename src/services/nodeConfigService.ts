import { INodeInfoBaseToken } from "@iota/iota.js";
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
     * The bech32 hrp.
     */
    private _bech32Hrp: string;

    /**
     * The bech32 hrp.
     */
    private _baseToken: INodeInfoBaseToken;

    /**
     * The storage servie.
     */
    private readonly _storageService: SessionStorageService;

    /**
     * Create a new instance of NodeConfigService.
     */
    constructor() {
        this._storageService = ServiceFactory.get<SessionStorageService>("session-storage");
        this._bech32Hrp = "iota";
        this._networkId = "";
        this._baseToken = {
            name: "IOTA",
            tickerSymbol: "MIOTA",
            unit: "i",
            decimals: 0,
            subunit: undefined,
            useMetricPrefix: true
        };
    }

    /**
     * Initialise NodeConfigService.
     */
    public async initialize(): Promise<void> {
        this._bech32Hrp = this._storageService.load<string>("bech32Hrp");
        this._networkId = this._storageService.load<string>("networkId");
        this._baseToken = this._storageService.load<INodeInfoBaseToken>("baseToken");

        if (!this._bech32Hrp || !this._networkId || !this._baseToken) {
            const tangleService = ServiceFactory.get<TangleService>("tangle");

            try {
                const info = await tangleService.info();
                this.setBech32Hrp(info.protocol.bech32Hrp);
                this.setNetworkId(info.protocol.networkName);
                this.setBaseToken(info.baseToken);
            } catch {}
        }
    }

    /**
     * Get the hrp for bech32 addresses.
     * @returns The bech32 hrp.
     */
    public getBech32Hrp(): string {
        return this._bech32Hrp;
    }

    /**
     * Get the netwoork id.
     * @returns The network id.
     */
    public getNetworkId(): string {
        return this._networkId;
    }

    /**
     * Get the node base token.
     * @returns The node base token.
     */
    public getBaseToken(): INodeInfoBaseToken {
        return this._baseToken;
    }

    /**
     * Set the hrp for bech32 addresses.
     * @param bech32Hrp The new blind mode.
     */
    public setBech32Hrp(bech32Hrp: string): void {
        this._bech32Hrp = bech32Hrp;
        this._storageService.save<string>("bech32Hrp", this._bech32Hrp);
    }

    /**
     * Set the network id.
     * @param networkId The new blind mode.
     */
    public setNetworkId(networkId: string): void {
        this._networkId = networkId;
        this._storageService.save<string>("networkId", this._networkId);
    }

    /**
     * Set the base token.
     * @param baseToken The new blind mode.
     */
    public setBaseToken(baseToken: INodeInfoBaseToken): void {
        this._baseToken = baseToken;
        this._storageService.save("baseToken", this._baseToken);
    }
}
