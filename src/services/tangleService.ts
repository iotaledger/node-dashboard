import { ServiceFactory } from "../factories/serviceFactory";
import { SingleNodeClient } from "../models/clients/singleNodeClient";
import { IClient } from "../models/IClient";
import { INodeInfo } from "../models/info/INodeInfo";
import { IBlock } from "../models/tangle/IBlock";
import { AuthService } from "./authService";
/**
 * Service to handle api requests.
 */
export class TangleService {
    /**
     * The node info.
     */
    private _nodeInfo?: INodeInfo;

    /**
     * The auth service.
     */
    private readonly _authService: AuthService;

    /**
     * Create a new instance of TangleService.
     */
    constructor() {
        this._authService = ServiceFactory.get<AuthService>("auth");
    }

    /**
     * Get the node info.
     * @returns The node info.
     */
    public async info(): Promise<INodeInfo> {
        const client = this.buildClient();
        this._nodeInfo = await client.info();
        return this._nodeInfo;
    }

    /**
     * Get the block payload.
     * @param blockId The block to get.
     * @returns The response data.
     */
    public async block(blockId: string): Promise<IBlock | undefined> {
        try {
            const client = this.buildClient();
            return await client.block(blockId);
        } catch {}
    }

    /**
     * Add a peer.
     * @param peerAddress The peer address.
     * @param peerAlias The peer alias.
     */
    public async peerAdd(peerAddress: string, peerAlias: string): Promise<void> {
        const client = this.buildClient();

        await client.peerAdd(peerAddress, peerAlias);
    }

    /**
     * Delete a peer.
     * @param peerId The peer to delete.
     */
    public async peerDelete(peerId: string): Promise<void> {
        const client = this.buildClient();

        await client.peerDelete(peerId);
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
