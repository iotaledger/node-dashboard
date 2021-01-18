import { Bech32Helper, Converter, IIndexationPayload, IMessageMetadata, IMilestonePayload, INodeInfo, ITransactionPayload, SingleNodeClient } from "@iota/iota.js";
import { ISearchResponse } from "../models/tangle/ISearchResponse";

/**
 * Service to handle api requests.
 */
export class TangleService {
    /**
     * The api client.
     */
    private readonly _client: SingleNodeClient;

    /**
     * The node info.
     */
    private _nodeInfo?: INodeInfo;

    /**
     * Create a new instance of TangleService.
     */
    constructor() {
        this._client = new SingleNodeClient(
            `${window.location.protocol}//${window.location.host}`, { basePath: "/api/v1/" });
    }

    /**
     * Get the node info.
     * @returns The node info.
     */
    public async info(): Promise<INodeInfo> {
        this._nodeInfo = await this._client.info();
        return this._nodeInfo;
    }

    /**
     * Query the node.
     * @param query The query to search for.
     * @returns The response data.
     */
    public async search(query: string): Promise<ISearchResponse> {
        const queryLower = query.toLowerCase();

        try {
            // If the query is an integer then lookup a milestone
            if (/^\d+$/.test(query)) {
                const milestone = await this._client.milestone(Number.parseInt(query, 10));

                return {
                    milestone
                };
            }
        } catch { }

        try {
            if (!this._nodeInfo) {
                await this.info();
            }
            if (this._nodeInfo && Bech32Helper.matches(queryLower, this._nodeInfo.bech32HRP)) {
                const address = await this._client.address(queryLower);

                if (address) {
                    const addressOutputs = await this._client.addressOutputs(queryLower);

                    return {
                        address,
                        addressOutputIds: addressOutputs.outputIds
                    };
                }
            }
        } catch { }

        try {
            // If the query is 64 bytes hex, try and look for a message
            if (Converter.isHex(queryLower) && queryLower.length === 64) {
                const message = await this._client.message(queryLower);

                return {
                    message
                };
            }
        } catch { }

        try {
            // If the query is 68 bytes hex, try and look for an output
            if (Converter.isHex(queryLower) && queryLower.length === 68) {
                const output = await this._client.output(queryLower);

                return {
                    output
                };
            }
        } catch { }

        try {
            if (Converter.isHex(queryLower) && queryLower.length === 64) {
                // We have 64 characters hex so could possible be a raw ed25519 address
                const address = await this._client.addressEd25519(queryLower);

                const addressOutputs = await this._client.addressEd25519Outputs(queryLower);

                if (addressOutputs.count > 0) {
                    return {
                        address,
                        addressOutputIds: addressOutputs.outputIds
                    };
                }
            }
        } catch { }

        try {
            // If the query is between 1 and 64 characters try a indexation lookup
            if (query.length > 0 && query.length <= 64) {
                const messages = await this._client.messagesFind(query);

                if (messages.count > 0) {
                    return {
                        indexMessageIds: messages.messageIds
                    };
                }
            }
        } catch { }

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
            const message = await this._client.message(messageId);

            return message?.payload;
        } catch { }
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
            const metadata = await this._client.messageMetadata(messageId);
            const children = await this._client.messageChildren(messageId);

            return {
                metadata,
                childrenIds: children ? children.childrenMessageIds : undefined
            };
        } catch { }
    }
}
