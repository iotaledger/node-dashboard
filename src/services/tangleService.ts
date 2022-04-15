import { addressBalance, Bech32Helper, ClientError, IClient, ITaggedDataPayload, IMessageMetadata, IMilestonePayload, IMilestoneResponse, INodeInfo, IOutputResponse, ITransactionPayload, SingleNodeClient, IndexerPluginClient, IOutputsResponse } from "@iota/iota.js";
import { Converter, HexHelper } from "@iota/util.js";
import { ServiceFactory } from "../factories/serviceFactory";
import { IAddressDetails } from "../models/IAddressDetails";
import { ISearchResponse } from "../models/tangle/ISearchResponse";
import { Bech32AddressHelper } from "../utils/bech32AddressHelper";
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
    public async search(query: string): Promise<ISearchResponse & { unavailable?: boolean }> {
        const queryLower = query.toLowerCase();
        const queryLowerNoPrefix = HexHelper.stripPrefix(queryLower);

        const client = this.buildClient();
        const indexerPlugin = new IndexerPluginClient(client);

        if (!this._nodeInfo) {
            await this.info();
        }
        const bech32HRP = this._nodeInfo ? this._nodeInfo.protocol.bech32HRP : Bech32Helper.BECH32_DEFAULT_HRP_MAIN;

        try {
            // If the query is an integer then lookup a milestone
            if (/^\d+$/.test(query)) {
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

        // If the query is 64 bytes hex, try and look for a message
        if (Converter.isHex(queryLowerNoPrefix) && queryLowerNoPrefix.length === 64) {
            try {
                const message = await client.message(HexHelper.addPrefix(queryLowerNoPrefix));

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
                const message = await client.transactionIncludedMessage(HexHelper.addPrefix(queryLowerNoPrefix));
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
        // Address bech32
        if (Bech32Helper.matches(queryLowerNoPrefix, bech32HRP)) {
            try {
                if (queryLowerNoPrefix.length > 45) {
                    // ed
                    const address = await this.addressBalance(queryLowerNoPrefix);

                    if (address && address.ledgerIndex > 0) {
                        const basicOutputs = await indexerPlugin.outputs({ addressBech32: queryLowerNoPrefix });
                        const aliasOutputs = await indexerPlugin.aliases({ stateControllerBech32: queryLowerNoPrefix });
                        const nftOutputs = await indexerPlugin.nfts({ addressBech32: queryLowerNoPrefix });

                        return {
                            address,
                            addressOutputIds: basicOutputs.items.concat(aliasOutputs.items, nftOutputs.items)
                        };
                    }
                } else {
                    // nft/alias
                    const address = Bech32AddressHelper.buildAddress(queryLowerNoPrefix, bech32HRP);
                    if (address.hex) {
                        const outputsResponse = address.type === 8
                            ? await indexerPlugin.alias(HexHelper.addPrefix(address.hex))
                            : await indexerPlugin.nft(HexHelper.addPrefix(address.hex));

                        if (outputsResponse.items.length > 0) {
                            const output = await client.output(outputsResponse.items[0]);
                            return {
                                output
                            };
                        }
                    }
                }
            } catch (err) {
                if (err instanceof ClientError && this.checkForUnavailable(err)) {
                    return {
                        unavailable: true
                    };
                }
            }
        }

        if (Converter.isHex(queryLowerNoPrefix)) {
            // NftId/AliasId
            if (queryLowerNoPrefix.length === 40 || queryLowerNoPrefix.length === 42) {
                try {
                    // remove type byte
                    const queryLowerNoType = queryLowerNoPrefix.length === 42
                            ? queryLowerNoPrefix.slice(2) : queryLowerNoPrefix;
                    let outputsResponse: IOutputsResponse = {} as IOutputsResponse;
                    try {
                        outputsResponse = await indexerPlugin.alias(HexHelper.addPrefix(queryLowerNoType));
                    } catch {
                        outputsResponse = await indexerPlugin.nft(HexHelper.addPrefix(queryLowerNoType));
                    }
                    if (outputsResponse.items.length > 0) {
                        const output = await client.output(outputsResponse.items[0]);
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
            }

            // Address ed25519
            if (queryLowerNoPrefix.length === 64 || queryLowerNoPrefix.length === 66) {
                try {
                    // remove type byte
                    const queryLowerNoType = queryLowerNoPrefix.length === 66
                            ? queryLowerNoPrefix.slice(2) : queryLowerNoPrefix;
                    const address = Bech32AddressHelper.buildAddress(queryLowerNoType, bech32HRP);

                    if (address.bech32) {
                        const addrBalance = await this.addressBalance(address.bech32);

                        if (addrBalance && addrBalance.ledgerIndex > 0) {
                            const basicOutputs = await indexerPlugin.outputs({ addressBech32: address.bech32 });
                            const aliasOutputs = await indexerPlugin.aliases({ stateControllerBech32: address.bech32 });
                            const nftOutputs = await indexerPlugin.nfts({ addressBech32: address.bech32 });

                            return {
                                address: addrBalance,
                                addressOutputIds: basicOutputs.items.concat(aliasOutputs.items, nftOutputs.items)
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
            }


            // If the query is 68 bytes hex, try and look for an output
            if (queryLowerNoPrefix.length === 68) {
                try {
                    const output = await client.output(HexHelper.addPrefix(queryLowerNoPrefix));
                    return {
                        output
                    };
                } catch (err) {
                    if (err instanceof ClientError && this.checkForUnavailable(err)) {
                        return {
                            unavailable: true
                        };
                    }
                }
            }

            if (queryLowerNoPrefix.length === 52 || queryLowerNoPrefix.length === 76) {
                try {
                    // Foundry lookup by foundry id or token id
                    const foundryId = queryLowerNoPrefix.length === 76
                            ? queryLowerNoPrefix.slice(0, 52) : queryLowerNoPrefix;
                    const foundryOutputs = await indexerPlugin.foundry(HexHelper.addPrefix(foundryId));

                    if (foundryOutputs.items.length > 0) {
                        const output = await client.output(foundryOutputs.items[0]);
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
            }

            // Basic output tag search
            try {
                // search outputs by tag
                const outputs = await indexerPlugin.outputs({ tagHex: HexHelper.addPrefix(queryLowerNoPrefix) });

                if (outputs.items.length > 0) {
                    const output = await client.output(outputs.items[0]);
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
            const address = await addressBalance(client, addressBech32) as unknown as IAddressDetails;

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
