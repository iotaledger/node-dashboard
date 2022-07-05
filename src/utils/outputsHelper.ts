import { IndexerPluginClient, IOutputsResponse, IClient } from "@iota/iota.js";
import { AssociationType, IAssociatedOutput } from "../models/tangle/IAssociatedOutputsResponse";

/**
 * Helper class to fetch outputs of an query on stardust.
 */
export class OutputsHelper {
    public readonly associatedOutputs: IAssociatedOutput[] = [];

    private readonly query: string;

    private readonly client: IClient;

    constructor(query: string, client: IClient) {
        this.query = query;
        this.client = client;
    }

    public async fetchOutputsByTag() {
        const indexerPlugin = new IndexerPluginClient(this.client);

        const promises = [
            this.tryFetchOutputs(
                async query => indexerPlugin.outputs(query),
                { tag: this.query },
                AssociationType.TAG
            ),
            this.tryFetchOutputs(
                async query => indexerPlugin.nfts(query),
                { tag: this.query },
                AssociationType.TAG
            )
        ];
        await Promise.all(promises);
    }

    public async fetchAssociatedOutputs() {
        const indexerPlugin = new IndexerPluginClient(this.client);

        const promises = [
            // Basic output
            this.tryFetchOutputs(
                async query => indexerPlugin.outputs(query),
                { addressBech32: this.query },
                AssociationType.BASIC_OUTPUT
            ),

            // Basic output -> storage return address
            this.tryFetchOutputs(
                async query => indexerPlugin.outputs(query),
                { storageReturnAddressBech32: this.query },
                AssociationType.BASIC_STORAGE_RETURN
            ),

            // Basic output -> expiration return address
            this.tryFetchOutputs(
                async query => indexerPlugin.outputs(query),
                { expirationReturnAddressBech32: this.query },
                AssociationType.BASIC_EXPIRATION_RETURN
            ),

            // Basic output -> sender address
            this.tryFetchOutputs(
                async query => indexerPlugin.outputs(query),
                { senderBech32: this.query },
                AssociationType.BASIC_SENDER
            ),

            // Alias output -> state controller address
            this.tryFetchOutputs(
                async query => indexerPlugin.aliases(query),
                { stateControllerBech32: this.query },
                AssociationType.ALIAS_STATE_CONTROLLER
            ),

            // Alias output -> governor address
            this.tryFetchOutputs(
                async query => indexerPlugin.aliases(query),
                { governorBech32: this.query },
                AssociationType.ALIAS_GOVERNOR
            ),

            // Alias output -> issuer address
            this.tryFetchOutputs(
                async query => indexerPlugin.aliases(query),
                { issuerBech32: this.query },
                AssociationType.ALIAS_ISSUER
            ),

            // Alias output -> sender address
            this.tryFetchOutputs(
                async query => indexerPlugin.aliases(query),
                { senderBech32: this.query },
                AssociationType.ALIAS_SENDER
            ),

            // Foundry output ->  alias address
            this.tryFetchOutputs(
                async query => indexerPlugin.foundries(query),
                { aliasAddressBech32: this.query },
                AssociationType.FOUNDRY_ALIAS
            ),

            // Nfts output
            this.tryFetchOutputs(
                async query => indexerPlugin.nfts(query),
                { addressBech32: this.query },
                AssociationType.NFT_OUTPUT
            ),

            // Nft output -> storage return address
            this.tryFetchOutputs(
                async query => indexerPlugin.nfts(query),
                { storageReturnAddressBech32: this.query },
                AssociationType.NFT_STORAGE_RETURN
            ),

            // Nft output -> expiration return address
            this.tryFetchOutputs(
                async query => indexerPlugin.nfts(query),
                { expirationReturnAddressBech32: this.query },
                AssociationType.NFT_EXPIRATION_RETURN
            ),

            // Nft output -> sender address
            this.tryFetchOutputs(
                async query => indexerPlugin.nfts(query),
                { senderBech32: this.query },
                AssociationType.NFT_SENDER
            )
        ];

        await Promise.all(promises);
    }


    private async tryFetchOutputs(
        fetch: (req: Record<string, unknown>) => Promise<IOutputsResponse>,
        request: Record<string, unknown>,
        association: AssociationType
     ) {
         const associatedOutputs = this.associatedOutputs;
         let cursor: string | undefined;

         do {
             try {
                 const outputs = await fetch({ ...request, cursor });

                 if (outputs.items.length > 0) {
                     for (const outputId of outputs.items) {
                         associatedOutputs.push({ outputId, association });
                     }
                 }

                 cursor = outputs.cursor;
             } catch {}
         } while (cursor);
     }
}
