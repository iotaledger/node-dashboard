import { Bech32Helper, Converter, IClient, IIndexationPayload, IMessageMetadata, IMilestonePayload, IMilestoneResponse, INodeInfo, IOutputResponse, ITransactionPayload, SingleNodeClient } from "@iota/iota.js";
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

        // If the query is 64 bytes hex, try and look for a message
        if (Converter.isHex(queryLower) && queryLower.length === 64) {
            try {
                const message = await client.message(queryLower);

                return {
                    message
                };
            } catch {}

            // If the query is 64 bytes hex, try and look for a transaction included message
            try {
                const message = await client.transactionIncludedMessage(queryLower);

                return {
                    message
                };
            } catch {}
        }

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
            if (query.length > 0) {
                let messages;
                let indexMessageType: "utf8" | "hex" | undefined;

                // If the query is between 2 and 128 hex chars assume hex encoded bytes
                if (query.length >= 2 && query.length <= 128 && Converter.isHex(queryLower)) {
                    messages = await client.messagesFind(Converter.hexToBytes(queryLower));

                    if (messages.count > 0) {
                        indexMessageType = "hex";
                    }
                }

                // If not already found and query less than 64 bytes assume its UTF8
                if (!indexMessageType && query.length <= 64) {
                    messages = await client.messagesFind(query);
                    if (messages.count > 0) {
                        indexMessageType = "utf8";
                    }
                }

                if (messages && messages.count > 0) {
                    return {
                        indexMessageIds: messages.messageIds,
                        indexMessageType
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
     * Get the output details.
     * @param outputId The output to get the details for.
     * @returns The details response.
     */
    public async outputDetails(
        outputId: string): Promise<IOutputResponse | undefined> {
        try {
            const client = this.buildClient();

            return await client.output(outputId);
        } catch {}
    }

    /**
     * Get the miletsone details.
     * @param milestoneIndex The miletsone to get the details for.
     * @returns The details response.
     */
    public async milestoneDetails(
        milestoneIndex: number): Promise<IMilestoneResponse | undefined> {
        try {
            const client = this.buildClient();

            return await client.milestone(milestoneIndex);
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
        const jwt = this._authService.isLoggedIn();
        const headers: { [id: string]: string} = {};

        if (jwt) {
            headers.Authorization = `Bearer ${jwt}`;
        }

        const csrf = this._authService.csrf();
        if (csrf) {
            headers["X-CSRF-Token"] = csrf;
        }

        return new SingleNodeClient(
            `${window.location.protocol}//${window.location.host}`,
            {
                basePath: "/api/v1/",
                headers
            });
    }
}
