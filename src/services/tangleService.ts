import { addressBalance, Bech32Helper, ClientError, IClient, ITaggedDataPayload, IBlockMetadata, IMilestonePayload, INodeInfo, IOutputResponse, ITransactionPayload, SingleNodeClient, IndexerPluginClient, ED25519_ADDRESS_TYPE, ALIAS_ADDRESS_TYPE, NFT_ADDRESS_TYPE, ALIAS_OUTPUT_TYPE, NFT_OUTPUT_TYPE } from "@iota/iota.js";
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

        // If the query is an integer then lookup a milestone
        if (/^\d+$/.test(query)) {
            try {
                const milestone = await client.milestoneByIndex(Number.parseInt(query, 10));

                return {
                    milestone
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
                const address = Bech32AddressHelper.buildAddress(queryLowerNoPrefix, bech32HRP);

                if (address.type === 0) {
                    // ed
                    const addrBalance = await this.addressBalance(queryLowerNoPrefix);
                    const basicOutputs = await indexerPlugin.outputs({ addressBech32: queryLowerNoPrefix });
                    const aliasOutputs = await indexerPlugin.aliases({ stateControllerBech32: queryLowerNoPrefix });
                    const nftOutputs = await indexerPlugin.nfts({ addressBech32: queryLowerNoPrefix });
                    const addressOutputIds = basicOutputs.items.concat(aliasOutputs.items, nftOutputs.items);

                    return {
                        address: { ...address, ...addrBalance },
                        addressOutputIds
                    };
                }

                if (address.type === 8 && address.hex) {
                     // Address alias
                    const aliasOutput = await indexerPlugin.alias(HexHelper.addPrefix(address.hex));
                    if (aliasOutput.items.length > 0) {
                        const foundryOutputs = await indexerPlugin.foundries({ aliasAddressBech32: address.bech32 });

                        return {
                            address,
                            addressOutputIds: [...aliasOutput.items, ...foundryOutputs.items]
                        };
                    }
                }

                if (address.type === 16 && address.hex) {
                    const nftOutput = await indexerPlugin.nft(HexHelper.addPrefix(address.hex));

                    if (nftOutput.items.length > 0) {
                        return {
                            address,
                            addressOutputIds: nftOutput.items
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

        if (Converter.isHex(queryLowerNoPrefix)) {
            if (queryLowerNoPrefix.length === 64) {
                // search for a block
                try {
                    const block = await client.block(HexHelper.addPrefix(queryLowerNoPrefix));

                    return {
                        block
                    };
                } catch (err) {
                    if (err instanceof ClientError && this.checkForUnavailable(err)) {
                        return {
                            unavailable: true
                        };
                    }
                }

                // search for a transaction included block
                try {
                    const block = await client.transactionIncludedBlock(HexHelper.addPrefix(queryLowerNoPrefix));
                    return {
                        block
                    };
                } catch (err) {
                    if (err instanceof ClientError && this.checkForUnavailable(err)) {
                        return {
                            unavailable: true
                        };
                    }
                }

                // search for a milestone by id
                try {
                    const milestone = await client.milestoneById(HexHelper.addPrefix(queryLowerNoPrefix));

                    return {
                        milestone
                    };
                } catch (err) {
                    if (err instanceof ClientError && this.checkForUnavailable(err)) {
                        return {
                            unavailable: true
                        };
                    }
                }
            }

           // Address ed25519/NftId/AliasId
            if (queryLowerNoPrefix.length === 64 || queryLowerNoPrefix.length === 66) {
                 // remove type byte
                 const queryLowerNoType = queryLowerNoPrefix.length === 66
                 ? queryLowerNoPrefix.slice(2) : queryLowerNoPrefix;

                // Address ed25519
                try {
                    const address = Bech32AddressHelper.buildAddress(queryLowerNoType, bech32HRP, ED25519_ADDRESS_TYPE);
                    if (address.bech32) {
                        const addrBalance = await this.addressBalance(address.bech32);

                        const basicOutputs = await indexerPlugin.outputs({ addressBech32: address.bech32 });
                        const aliasOutputs = await indexerPlugin.aliases({ stateControllerBech32: address.bech32 });
                        const nftOutputs = await indexerPlugin.nfts({ addressBech32: address.bech32 });
                        const addressOutputIds = basicOutputs.items.concat(aliasOutputs.items, nftOutputs.items);

                        if (addressOutputIds.length > 0) {
                            return {
                                address: { ...address, ...addrBalance },
                                addressOutputIds
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
                // Address alias
                try {
                    const aliasOutput = await indexerPlugin.alias(HexHelper.addPrefix(queryLowerNoType));
                    if (aliasOutput.items.length > 0) {
                        const address = Bech32AddressHelper
                                        .buildAddress(queryLowerNoType, bech32HRP, ALIAS_ADDRESS_TYPE);
                        const foundryOutputs = await indexerPlugin.foundries({ aliasAddressBech32: address.bech32 });

                        return {
                            address,
                            addressOutputIds: [...aliasOutput.items, ...foundryOutputs.items]
                        };
                    }
                } catch (err) {
                    if (err instanceof ClientError && this.checkForUnavailable(err)) {
                        return {
                            unavailable: true
                        };
                    }
                }
                // Address nft
                try {
                    const nftOutput = await indexerPlugin.nft(HexHelper.addPrefix(queryLowerNoType));

                    if (nftOutput.items.length > 0) {
                        const address = Bech32AddressHelper.buildAddress(queryLowerNoType, bech32HRP, NFT_ADDRESS_TYPE);

                        return {
                            address,
                            addressOutputIds: nftOutput.items
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

            // If the query is 68 bytes hex, try and look for an output
            if (queryLowerNoPrefix.length === 68) {
                try {
                    const outputResponse = await client.output(HexHelper.addPrefix(queryLowerNoPrefix));

                    if (outputResponse.output) {
                        if (outputResponse.output.type === ALIAS_OUTPUT_TYPE) {
                            const address = Bech32AddressHelper
                                            .buildAddress(queryLowerNoPrefix, bech32HRP, ALIAS_ADDRESS_TYPE);
                            const foundryOutputs = await indexerPlugin
                                                        .foundries({ aliasAddressBech32: address.bech32 });
                            return {
                                address,
                                addressOutputIds: [HexHelper.addPrefix(queryLowerNoPrefix), ...foundryOutputs.items]
                            };
                        }
                        if (outputResponse.output.type === NFT_OUTPUT_TYPE) {
                            const address = Bech32AddressHelper
                                            .buildAddress(queryLowerNoPrefix, bech32HRP, NFT_ADDRESS_TYPE);
                            return {
                                address,
                                addressOutputIds: [HexHelper.addPrefix(queryLowerNoPrefix)]
                            };
                        }
                        return {
                            outputId: HexHelper.addPrefix(queryLowerNoPrefix),
                            output: outputResponse
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

            if (queryLowerNoPrefix.length === 76 || queryLowerNoPrefix.length === 100) {
                try {
                    // Foundry lookup by foundry id or token id
                    const foundryId = queryLowerNoPrefix.length === 100
                            ? queryLowerNoPrefix.slice(0, 76) : queryLowerNoPrefix;
                    const foundryOutputs = await indexerPlugin.foundry(HexHelper.addPrefix(foundryId));

                    if (foundryOutputs.items.length > 0) {
                        return {
                            outputId: foundryOutputs.items[0]
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
     * Get the block payload.
     * @param blockId The block to get.
     * @returns The response data.
     */
    public async payload(
        blockId: string): Promise<ITransactionPayload | ITaggedDataPayload | IMilestonePayload | undefined> {
        try {
            const client = this.buildClient();

            const block = await client.block(blockId);

            return block?.payload;
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

            return address;
        } catch {}
    }

    /**
     * Get the miletsone details.
     * @param milestoneIndex The miletsone to get the details for.
     * @returns The details response.
     */
    public async milestoneDetails(
        milestoneIndex: number): Promise<IMilestonePayload | undefined> {
        try {
            const client = this.buildClient();

            return await client.milestoneByIndex(milestoneIndex);
        } catch {}
    }

    /**
     * Get the block metadata.
     * @param blockId The block if to get the metadata for.
     * @returns The details response.
     */
    public async blockDetails(blockId: string): Promise<{
        metadata?: IBlockMetadata;
        childrenIds?: string[];
        unavailable?: boolean;
    } | undefined> {
        try {
            const client = this.buildClient();

            const metadata = await client.blockMetadata(blockId);
            const children = await client.blockChildren(blockId);

            return {
                metadata,
                childrenIds: children ? children.children : undefined
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
