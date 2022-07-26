import { Bech32Helper, ClientError, IClient, ITaggedDataPayload, IBlockMetadata, IMilestonePayload, IRoutesResponse, INodeInfo, IOutputResponse, ITransactionPayload, SingleNodeClient, IndexerPluginClient, ALIAS_ADDRESS_TYPE, NFT_ADDRESS_TYPE } from "@iota/iota.js";
import { ServiceFactory } from "../factories/serviceFactory";
import { IAssociatedOutput } from "../models/tangle/IAssociatedOutputsResponse";
import { ISearchRequest } from "../models/tangle/ISearchRequest";
import { ISearchResponse } from "../models/tangle/ISearchResponse";
import { Bech32AddressHelper } from "../utils/bech32AddressHelper";
import { OutputsHelper } from "../utils/outputsHelper";
import { SearchQuery, SearchQueryBuilder } from "../utils/searchQueryBuilder";
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
     * Get the routes the node exposes.
     * @returns The routes.
     */
     public async routes(): Promise<IRoutesResponse> {
        const client = this.buildClient();
        const routes = await client.routes();
        return routes;
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
     * Find item on the stardust network.
     * @param request The earch query
     * @returns The item found.
     */
    public async search(request: ISearchRequest): Promise<ISearchResponse & { unavailable?: boolean }> {
        const client = this.buildClient();
        const indexerPlugin = new IndexerPluginClient(client);

        if (!this._nodeInfo) {
            await this.info();
        }
        const bech32HRP = this._nodeInfo ? this._nodeInfo.protocol.bech32Hrp : Bech32Helper.BECH32_DEFAULT_HRP_MAIN;
        const searchQuery: SearchQuery = new SearchQueryBuilder(request.query, bech32HRP).build();

        if (searchQuery.milestoneIndex) {
            try {
                const milestone = await client.milestoneByIndex(searchQuery.milestoneIndex);

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

        if (searchQuery.milestoneId) {
            try {
                const milestone = await client.milestoneById(searchQuery.milestoneId);

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

        if (searchQuery.blockIdOrTransactionId) {
            try {
                const block = await client.block(searchQuery.blockIdOrTransactionId);

                if (Object.keys(block).length > 0) {
                    return {
                        block
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
                const block = await client.transactionIncludedBlock(searchQuery.blockIdOrTransactionId);

                if (Object.keys(block).length > 0) {
                    return {
                        block
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

        if (searchQuery.output) {
            try {
                return {
                    outputId: searchQuery.output,
                    output: await client.output(searchQuery.output)
                };
            } catch (err) {
                if (err instanceof ClientError && this.checkForUnavailable(err)) {
                    return {
                        unavailable: true
                    };
                }
            }
        }

        if (searchQuery.aliasId) {
            try {
                const aliasOutputs = await indexerPlugin.alias(searchQuery.aliasId);
                if (aliasOutputs.items.length > 0) {
                    const address = Bech32AddressHelper
                                        .buildAddress(searchQuery.aliasId, bech32HRP, ALIAS_ADDRESS_TYPE);
                    return {
                        address,
                        addressOutputIds: aliasOutputs.items
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

        if (searchQuery.nftId) {
            try {
                const nftOutputs = await indexerPlugin.nft(searchQuery.nftId);
                if (nftOutputs.items.length > 0) {
                    const address = Bech32AddressHelper
                                    .buildAddress(searchQuery.nftId, bech32HRP, NFT_ADDRESS_TYPE);
                    return {
                        address,
                        addressOutputIds: nftOutputs.items
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

        if (searchQuery.foundryId) {
            try {
                const foundryOutputs = await indexerPlugin.foundry(searchQuery.foundryId);
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

        if (searchQuery.tag) {
            try {
                const taggedOutputs = await indexerPlugin.outputs({ tagHex: searchQuery.tag });

                if (taggedOutputs.items.length > 0) {
                    return {
                        outputs: taggedOutputs.items
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

        if (searchQuery.address?.hexNoPrefix && searchQuery.address?.hexNoPrefix.length === 64) {
            try {
                return {
                    address: { ...searchQuery.address }
                };
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
     * Get the nft output details.
     * @param nftId The nft id to get the details for.
     * @returns The nft output response.
     */
     public async nftDetails(
        nftId: string): Promise<IOutputResponse & { outputId: string } | undefined> {
        try {
            const client = this.buildClient();
            const indexerPlugin = new IndexerPluginClient(client);

            const nftOutputs = await indexerPlugin.nft(nftId);
            if (nftOutputs.items.length > 0) {
                return { ...await client.output(nftOutputs.items[0]), outputId: nftOutputs.items[0] };
            }
        } catch {}
    }

    /**
     * Get the alias output details.
     * @param aliasId The alias id to get the details for.
     * @returns The alias output response.
     */
     public async aliasDetails(
        aliasId: string): Promise<IOutputResponse & { outputId: string } | undefined> {
        try {
            const client = this.buildClient();
            const indexerPlugin = new IndexerPluginClient(client);

            const aliasOutputs = await indexerPlugin.alias(aliasId);
            if (aliasOutputs.items.length > 0) {
                return { ...await client.output(aliasOutputs.items[0]), outputId: aliasOutputs.items[0] };
            }
        } catch {}
    }

    /**
     * Get the output details.
     * @param addressBech32 The address to get the outputs for.
     * @returns The associated outputs.
     */
    public async getOutputsForAddress(
        addressBech32: string): Promise<IAssociatedOutput[]> {
        let outputs: IAssociatedOutput[] = [];

        try {
            const client = this.buildClient();
            const helper = new OutputsHelper(addressBech32, client);
            await helper.fetchAssociatedOutputs();
            outputs = helper.associatedOutputs;
        } catch {}

        return outputs;
    }

    /**
     * Get the output details.
     * @param tag The tag to get the outputs for.
     * @returns The associated outputs.
     */
    public async getOutputsByTag(
        tag: string): Promise<IAssociatedOutput[]> {
        let outputs: IAssociatedOutput[] = [];

        try {
            const client = this.buildClient();
            const helper = new OutputsHelper(tag, client);
            await helper.fetchOutputsByTag();
            outputs = helper.associatedOutputs;
        } catch {}

        return outputs;
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
        unavailable?: boolean;
    } | undefined> {
        try {
            const client = this.buildClient();

            const metadata = await client.blockMetadata(blockId);

            return {
                metadata
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
                basePath: "/dashboard/api/",
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
