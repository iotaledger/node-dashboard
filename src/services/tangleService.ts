import { addressBalance,Bech32Helper, ClientError, IClient, ITaggedDataPayload, IMessageMetadata, IMilestonePayload, IMilestoneResponse, INodeInfo, IOutputResponse, ITransactionPayload, SingleNodeClient, IBasicOutput, IndexerPluginClient, ED25519_ADDRESS_TYPE } from "@iota/iota.js";
import { Converter } from "@iota/util.js";
import { ServiceFactory } from "../factories/serviceFactory";
import { ISearchResponse } from "../models/tangle/ISearchResponse";
import { AuthService } from "./authService";
import { IAddressDetails } from "../models/IAddressDetails";
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
    public async search(query: string): Promise<ISearchResponse & { unavailable?: boolean }> {
        const queryLower = query.toLowerCase();
        const client = this.buildClient();

        console.log("tangelSearch")
        console.log(queryLower)

        try {
            // If the query is an integer then lookup a milestone
            if (/^\d+$/.test(query)) {
                console.log("tangelSearch milestone")
                const milestone = await client.milestone(Number.parseInt(query, 10));

                return {
                    milestone
                };
            }
        } catch (err) {
            if (err instanceof ClientError && this.checkForUnavailable(err)) {
                return {
                    unavailable: true
                };
            }
        }

        try {
            if (!this._nodeInfo) {
                await this.info();
            }
            if (this._nodeInfo && Bech32Helper.matches(queryLower, this._nodeInfo.protocol.bech32HRP)) {
                const address = await this.addressBalance(queryLower);
                
                if (address) {
                    const indexerPlugin = new IndexerPluginClient(client);
                    const addressOutputs = await indexerPlugin.outputs({addressBech32: queryLower});

                    return {
                        address,
                        addressOutputIds: addressOutputs.items
                    };
                }
            }
        } catch (err) {
            if (err instanceof ClientError && this.checkForUnavailable(err)) {
                return {
                    unavailable: true
                };
            }
        }

        // If the query is 64 bytes hex, try and look for a message
        if (Converter.isHex(queryLower) && queryLower.length === 64) {
            console.log("tangelSearch message")
            try {
                const message = await client.message(queryLower);

                return {
                    message
                };
            } catch (err) {
                if (err instanceof ClientError && this.checkForUnavailable(err)) {
                    return {
                        unavailable: true
                    };
                }
            }

            // If the query is 64 bytes hex, try and look for a transaction included message
            try {
                console.log("tangelSearch transaction-included-message")

                const message = await client.transactionIncludedMessage(queryLower);
                return {
                    message
                };
            } catch (err) {
                if (err instanceof ClientError && this.checkForUnavailable(err)) {
                    return {
                        unavailable: true
                    };
                }
            }
        }

        try {
            // If the query is 68 bytes hex, try and look for an output
            if (Converter.isHex(queryLower) && queryLower.length === 68) {
                console.log("tangelSearch output")
                const output = await client.output(queryLower);

                return {
                    output
                };
            }
        } catch (err) {
            if (err instanceof ClientError && this.checkForUnavailable(err)) {
                return {
                    unavailable: true
                };
            }
        }

        try {
            if (!this._nodeInfo) {
                await this.info();
            }
            if (this._nodeInfo && Converter.isHex(queryLower) && queryLower.length === 64) {
                console.log("tangelSearch address ed25519")
                // We have 64 characters hex so could possible be a raw ed25519 address
                // const address = await client.addressEd25519(queryLower);
                // const addressOutputs = await client.addressEd25519Outputs(queryLower);

                // convert back to bech32 to do the search
                const bech32 = Bech32Helper.toBech32(ED25519_ADDRESS_TYPE, Converter.hexToBytes(queryLower), this._nodeInfo.protocol.bech32HRP)
                const address = await this.addressBalance(bech32);
                
                if (address) {
                    const indexerPlugin = new IndexerPluginClient(client);
                    const addressOutputs = await indexerPlugin.outputs({addressBech32: bech32});
                    return {
                        address,
                        addressOutputIds: addressOutputs.items
                    };
                }
            }
        } catch (err) {
            if (err instanceof ClientError && this.checkForUnavailable(err)) {
                return {
                    unavailable: true
                };
            }
        }

        try {
            if (query.length > 0) {
                let messages;
                let indexMessageType: "utf8" | "hex" | undefined;
                console.log("tangelSearch final message search")
                // If the query is between 2 and 128 hex chars assume hex encoded bytes
                if (query.length >= 2 && query.length <= 128 && Converter.isHex(queryLower)) {
                    console.log("1. try")
                    console.log(queryLower)
                    messages = await client.message(queryLower);
                    console.log(messages)
                    // if (messages.count > 0) {
                        indexMessageType = "hex";
                    // }
                }

                // If not already found and query less than 64 bytes assume its UTF8
                if (!indexMessageType && query.length <= 64) {
                    console.log("2. try")
                    messages = await client.message(query);
                    console.log(messages)
                    // if (messages.count > 0) {
                        indexMessageType = "utf8";
                    // }
                }

                // if (messages && messages.count > 0) {
                if (messages) {
                    return {
                        indexMessageIds: messages.parentMessageIds,
                        indexMessageType
                    };
                }
            }
        } catch (err) {
            if (err instanceof ClientError && this.checkForUnavailable(err)) {
                return {
                    unavailable: true
                };
            }
        }

        return {};
    }

    /**
     * Get the message payload.
     * @param messageId The message to get.
     * @returns The response data.
     */
    public async payload(
        messageId: string): Promise<ITransactionPayload | ITaggedDataPayload | IMilestonePayload | undefined> {
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
     * Get the balance for an address.
     * @param addressBech32 The address to get the balances for.
     * @returns The balance.
     */
    public async addressBalance(
        addressBech32: string): Promise<IAddressDetails | undefined> {
        try {
            const client = this.buildClient();
            let address = await addressBalance(client, addressBech32) as unknown as IAddressDetails;

            address.address = addressBech32;

            return address;
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
        unavailable?: boolean;
    } | undefined> {
        try {
            const client = this.buildClient();

            const metadata = await client.messageMetadata(messageId);
            const children = await client.messageChildren(messageId);

            return {
                metadata,
                childrenIds: children ? children.childrenMessageIds : undefined
            };
        } catch (err) {
            if (err instanceof ClientError && this.checkForUnavailable(err)) {
                return {
                    unavailable: true
                };
            }
        }
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
        const headers: { [id: string]: string } = {};

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
                basePath: "/api/v2/",
                headers
            });
    }

    /**
     * Check for the node being unavaialable.
     * @param error The error.
     * @returns unavailable if detected.
     */
    private checkForUnavailable(error: ClientError): boolean {
        return error.httpStatus === 503;
    }
}
