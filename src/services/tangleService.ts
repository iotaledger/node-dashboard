import { Bech32Helper, Converter, IClient, IIndexationPayload, IMessageMetadata, IMilestonePayload, INodeInfo, ITransactionPayload, SingleNodeClient } from "@iota/iota.js";
import { ServiceFactory } from "../factories/serviceFactory";
import { ISearchResponse } from "../models/tangle/ISearchResponse";
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
     * Query the node.
     * @param query The query to search for.
     * @returns The response data.
     */
    public async search(query: string): Promise<ISearchResponse> {
        const queryLower = query.toLowerCase();
        const client = this.buildClient();

        try {
            // If the query is an integer then lookup a milestone
            if (/^\d+$/.test(query)) {
                const milestone = await client.milestone(Number.parseInt(query, 10));

                return {
                    milestone
                };
            }
        } catch {}

        try {
            if (!this._nodeInfo) {
                await this.info();
            }
            if (this._nodeInfo && Bech32Helper.matches(queryLower, this._nodeInfo.bech32HRP)) {
                const address = await client.address(queryLower);

                if (address) {
                    const addressOutputs = await client.addressOutputs(queryLower);

                    return {
                        address,
                        addressOutputIds: addressOutputs.outputIds
                    };
                }
            }
        } catch {}

        try {
            // If the query is 64 bytes hex, try and look for a message
            if (Converter.isHex(queryLower) && queryLower.length === 64) {
                const message = await client.message(queryLower);

                return {
                    message
                };
            }
        } catch {}

        try {
            // If the query is 68 bytes hex, try and look for an output
            if (Converter.isHex(queryLower) && queryLower.length === 68) {
                const output = await client.output(queryLower);

                return {
                    output
                };
            }
        } catch {}

        try {
            if (Converter.isHex(queryLower) && queryLower.length === 64) {
                // We have 64 characters hex so could possible be a raw ed25519 address
                const address = await client.addressEd25519(queryLower);

                const addressOutputs = await client.addressEd25519Outputs(queryLower);

                if (addressOutputs.count > 0) {
                    return {
                        address,
                        addressOutputIds: addressOutputs.outputIds
                    };
                }
            }
        } catch {}

        try {
            // If the query is between 1 and 64 characters try a indexation lookup
            if (query.length > 0 && query.length <= 64) {
                const messages = await client.messagesFind(query);

                if (messages.count > 0) {
                    return {
                        indexMessageIds: messages.messageIds
                    };
                }
            }
        } catch {}

        return {};
    }

    /**
     * Get the message payload.
     * @param messageId The message to get.
     * @returns The response data.
     */
    public async payload(
        messageId: string): Promise<ITransactionPayload | IIndexationPayload | IMilestonePayload | undefined> {
        try {
            const client = this.buildClient();

            const message = await client.message(messageId);

            return message?.payload;
        } catch {}
    }

    /**
     * Get the message metadata.
     * @param messageId The message if to get the metadata for.
     * @returns The details response.
     */
    public async messageDetails(messageId: string): Promise<{
        metadata?: IMessageMetadata;
        childrenIds?: string[];
    } | undefined> {
        try {
            const client = this.buildClient();

            const metadata = await client.messageMetadata(messageId);
            const children = await client.messageChildren(messageId);

            return {
                metadata,
                childrenIds: children ? children.childrenMessageIds : undefined
            };
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
        const loginData = this._authService.isLoggedIn();
        const headers: { [id: string]: string} = {};

        if (loginData?.jwt) {
            headers.Authorization = `Bearer ${loginData.jwt}`;
        }
        if (loginData?.csrf) {
            headers["X-CSRF-Token"] = loginData.csrf;
        }

        return new SingleNodeClient(
            `${window.location.protocol}//${window.location.host}`,
            {
                basePath: "/api/v1/",
                headers
            });
    }
}
