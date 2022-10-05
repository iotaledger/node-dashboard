import { IClient, SingleNodeClient } from "@iota/iota.js";
import { ServiceFactory } from "../factories/serviceFactory";
import { IPoi } from "../models/plugins/IPoi";
import { IValidateProofResponse } from "../models/plugins/IValidateProofResponse";
import { FetchHelper } from "../utils/fetchHelper";
import { AuthService } from "./authService";

/**
 * Service to handle plugins api requests.
 */
export class PluginService {
    /**
     * The auth service.
     */
    private readonly _authService: AuthService;

    /**
     * Create a new instance of PluginService.
     */
    constructor() {
        this._authService = ServiceFactory.get<AuthService>("auth");
    }

    /**
     * Get the poi for the message.
     * @param txHash The id of the message.
     * @returns The poi for the message.
     */
    public async fetchPoi(txHash: string): Promise<IPoi | undefined> {
        try {
            return await FetchHelper.json<unknown, IPoi>(
                `${window.location.protocol}//${window.location.host}`,
                `/dashboard/api/plugins/poi/create/${txHash}`,
                "get",
                undefined,
                this.buildAuthHeaders());
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * Validate the poi for the message.
     * @param poi The poi of the message.
     * @returns Is poi valid.
     */
    public async validatePoi(poi: IPoi): Promise<boolean> {
        try {
            const response = await FetchHelper.json<IPoi, IValidateProofResponse>(
                `${window.location.protocol}//${window.location.host}`,
                "/dashboard/api/plugins/poi/validate",
                "post",
                poi,
                this.buildAuthHeaders()
            );

            return response.valid;
        } catch (err) {
            console.log(err);
            return false;
        }
    }

    /**
     * Build authentication headers.
     * @returns The authentication headers.
     */
    private buildAuthHeaders(): Record<string, string> {
        const headers: Record<string, string> = {};
        const jwt = this._authService.isLoggedIn();
        if (jwt) {
            headers.Authorization = `Bearer ${jwt}`;
        }
        const csrf = this._authService.csrf();
        if (csrf) {
            headers["X-CSRF-Token"] = csrf;
        }

        return headers;
    }

    /**
     * Build a client with auth header.
     * @returns The client.
     */
    private buildClient(): IClient {
        const headers = this._authService.buildAuthHeaders();

        return new SingleNodeClient(
            `${window.location.protocol}//${window.location.host}`,
            {
                basePath: "/dashboard/api/",
                headers
            });
    }
}
