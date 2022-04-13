import { addressBalance, Bech32Helper, ClientError, IClient, ITaggedDataPayload, IMessageMetadata, IMilestonePayload, IMilestoneResponse, INodeInfo, IOutputResponse, ITransactionPayload, SingleNodeClient, IndexerPluginClient, ED25519_ADDRESS_TYPE, NFT_ADDRESS_TYPE, ALIAS_ADDRESS_TYPE } from "@iota/iota.js";
import { Converter, HexHelper } from "@iota/util.js";
import { ServiceFactory } from "../factories/serviceFactory";
import { IAddressDetails } from "../models/IAddressDetails";
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
    public async search(query: string): Promise<ISearchResponse & { unavailable?: boolean }> {
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
        } catch (err) {
            if (err instanceof ClientError && this.checkForUnavailable(err)) {
                return {
                    unavailable: true
                };
            }
        }


        // If the query is 64 bytes hex, try and look for a message
        if (Converter.isHex(queryLower, true) && (queryLower.length === 64 || queryLower.length === 66)) {

            try {

                //todo: append prefix to querylower if length is 64 and search
                const message = await client.message(HexHelper.hasPrefix(queryLower) ? queryLower : HexHelper.addPrefix(queryLower));

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
                const message = await client.transactionIncludedMessage(HexHelper.hasPrefix(queryLower) ? queryLower : HexHelper.addPrefix(queryLower));
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
            if (!this._nodeInfo) {
                await this.info();
            }
            if (this._nodeInfo && (Bech32Helper.matches(queryLower, this._nodeInfo.protocol.bech32HRP) ||
                    (Converter.isHex(queryLower, true) && 
                        queryLower.length === 40 || // Aliasid w/o prefix 6457f5f1bc2c3ec696889309cee0665c298f6394
                        queryLower.length === 42 || // Aliasid with 0x6457f5f1bc2c3ec696889309cee0665c298f6394 or Serialized AliasId w/o prefix 086457f5f1bc2c3ec696889309cee0665c298f6394
                        queryLower.length === 44 || // Serialized AliasId with prefix 0x086457f5f1bc2c3ec696889309cee0665c298f6394
                        queryLower.length === 64 || // ed25519 without prefix efdc112efe262b304bcf379b26c31bad029f616ee3ec4aa6345a366e4c9e43a3
                        queryLower.length === 66 || // ed25519 with prefix 0xefdc112efe262b304bcf379b26c31bad029f616ee3ec4aa6345a366e4c9e43a3
                        queryLower.length === 68  // ed25519 with prefix 0x00efdc112efe262b304bcf379b26c31bad029f616ee3ec4aa6345a366e4c9e43a3
                    )
                )) {

                let queryParam = queryLower;    
                if (!Bech32Helper.matches(queryLower, this._nodeInfo.protocol.bech32HRP) && HexHelper.hasPrefix(queryLower) ){
                    queryParam = HexHelper.stripPrefix(queryLower); // strip prefix
                }
                
                let addressBech32 = "";
                if (Bech32Helper.matches(queryLower, this._nodeInfo.protocol.bech32HRP)){
                    addressBech32 = queryLower;
                }else if(queryParam.length === 40){
                    // AliasId/NftId without prefix 6457f5f1bc2c3ec696889309cee0665c298f6394
                    addressBech32 = Bech32Helper.toBech32(
                            parseInt(queryParam.substring(0,2), 16) % 2 === 0 ? ALIAS_ADDRESS_TYPE : NFT_ADDRESS_TYPE, // if first byte is even than aliasId else nftId
                            Converter.hexToBytes(queryParam),
                            this._nodeInfo.protocol.bech32HRP
                        );
                } else if(queryParam.length === 42) {
                    // Serialized AliasId/nftId w/o prefix 086457f5f1bc2c3ec696889309cee0665c298f6394
                    addressBech32 = Bech32Helper.toBech32(
                            parseInt(queryParam.substring(0,2), 16) === 8 ? ALIAS_ADDRESS_TYPE : NFT_ADDRESS_TYPE, // if first byte is 8 than aliasId else 16 is nft
                            Converter.hexToBytes(queryParam.substring(2, queryParam.length)), //remove address type
                            this._nodeInfo.protocol.bech32HRP
                        );
                } else {
                    console.log("ed address")
                    // ED25519 address search: convert back to bech32 to do the search
                    addressBech32 = Bech32Helper.toBech32( 
                            ED25519_ADDRESS_TYPE,
                            Converter.hexToBytes(queryParam.length === 66 ? queryParam.substring(2, queryParam.length) : queryParam),
                            this._nodeInfo.protocol.bech32HRP
                        );
                }
                    
                console.log("search address")
                const address = await this.addressBalance(addressBech32);

                if (address) {
                // if (address  && address.ledgerIndex > 0) {
                    const indexerPlugin = new IndexerPluginClient(client);
                    const addressType = addressBech32.charAt(this._nodeInfo.protocol.bech32HRP.length + 1)
                    console.log("addressType")
                    console.log(addressType)
                    const addressOutputs = 
                        addressType === "q" ? await indexerPlugin.outputs({ addressBech32 }) :
                        (addressType === "p" ?  await indexerPlugin.aliases({ stateControllerBech32: addressBech32 }) :
                                                await indexerPlugin.nfts({ addressBech32 }) );

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
            // If the query is 68 bytes hex, try and look for an output
            if (Converter.isHex(queryLower, true) && (queryLower.length === 66 || queryLower.length === 68)) {
                console.log("search output")

                const output = await client.output(HexHelper.hasPrefix(queryLower) ? queryLower : HexHelper.addPrefix(queryLower));
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
            // Foundry lookup by foundry id or token id
            if (Converter.isHex(queryLower, true) &&
                queryLower.length === 52 ||
                queryLower.length === 54 ||
                queryLower.length === 76 ||
                queryLower.length === 78
                ) {
                console.log("search foundry")
                let foundryId = queryLower;
                if (!HexHelper.hasPrefix(queryLower)) {
                   foundryId = HexHelper.addPrefix(queryLower)
                }
                if (foundryId.length > 54){
                    foundryId = foundryId.substring(0,54)
                }
                const indexerPlugin = new IndexerPluginClient(client);
                const foundryOutputs = await indexerPlugin.foundry(foundryId);

                if(foundryOutputs.items.length > 0){
                    const output = await client.output(foundryOutputs.items[0]);
                    return {
                        output
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
            // search outputs by tag
            if (Converter.isHex(queryLower, true)) {
                console.log("search tag")
                const tagHex = HexHelper.hasPrefix(queryLower) ? queryLower : HexHelper.addPrefix(queryLower);

                const indexerPlugin = new IndexerPluginClient(client);
                const foundryOutputs = await indexerPlugin.outputs({ tagHex });

                if(foundryOutputs.items.length > 0){
                    const output = await client.output(foundryOutputs.items[0]);
                    return {
                        output
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
