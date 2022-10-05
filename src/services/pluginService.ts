import { IClient, SingleNodeClient } from "@iota/iota.js";
import { ServiceFactory } from "../factories/serviceFactory";
import { IPoi } from "../models/plugins/IPoi";
import { IValidateProofResponse } from "../models/plugins/IValidateProofResponse";
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
     * Get the poi for the block.
     * @param blockId The id of the block.
     * @returns The poi for the block.
     */
    public async fetchPoi(blockId: string): Promise<IPoi | undefined> {
        const client = this.buildClient();

        try {
            return await client.pluginFetch<unknown, IPoi>(
                "poi/v1/",
                "get",
                `create/${blockId}`
            );
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * Validate the poi for the block.
     * @param poi The poi of the block.
     * @returns Is poi valid.
     */
    public async validatePoi(poi: IPoi): Promise<boolean> {
        const client = this.buildClient();

        try {
            const response = await client.pluginFetch<IPoi, IValidateProofResponse>(
                "poi/v1/",
                "post",
                "validate",
                undefined,
                poi
            );

            return response.valid;
        } catch (err) {
            console.log(err);
            return false;
        }
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
