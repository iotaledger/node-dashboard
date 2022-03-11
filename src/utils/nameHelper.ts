import { 
    SIGNATURE_UNLOCK_BLOCK_TYPE, REFERENCE_UNLOCK_BLOCK_TYPE, ALIAS_UNLOCK_BLOCK_TYPE, NFT_UNLOCK_BLOCK_TYPE,
    UTXO_INPUT_TYPE, TREASURY_INPUT_TYPE,
    BASIC_OUTPUT_TYPE, ALIAS_OUTPUT_TYPE, NFT_OUTPUT_TYPE, FOUNDRY_OUTPUT_TYPE, TREASURY_OUTPUT_TYPE } from "@iota/iota.js";

export class NameHelper {
    /**
     * Get the name for the input type.
     * @param type The type to get the name for.
     * @returns The input type name.
     */
    public static getInputTypeName(type: number): string {
        if (type === UTXO_INPUT_TYPE) {
            return "UTXO Input";
        } else if (type === TREASURY_INPUT_TYPE) {
            return "Treasury Input";
        }
        return "Unknown Input";
    }

    /**
     * Get the name for the output type.
     * @param type The type to get the name for.
     * @returns The output type name.
     */
    public static getOutputTypeName(type: number): string {
        if (type === BASIC_OUTPUT_TYPE) {
            return "Basic Output";
        } else if (type === ALIAS_OUTPUT_TYPE) {
            return "Alias Output";
        } else if (type === NFT_OUTPUT_TYPE) {
            return "Nft Output";
        } else if (type === FOUNDRY_OUTPUT_TYPE) {
            return "Foundry Output";
        } else if (type === TREASURY_OUTPUT_TYPE) {
            return "Treasury Output";
        }
        return "Unknown Output";
    }

    /**
     * Get the name for the unlock block type.
     * @param type The type to get the name for.
     * @returns The unlock block type name.
     */
    public static getUnlockBlockTypeName(type: number): string {
        if (type === SIGNATURE_UNLOCK_BLOCK_TYPE) {
            return "Signature Unlock Block";
        } else if (type === REFERENCE_UNLOCK_BLOCK_TYPE) {
            return "Reference Unlock Block";
        } else if (type === ALIAS_UNLOCK_BLOCK_TYPE) {
            return "Alias Unlock Block";
        } else if (type === NFT_UNLOCK_BLOCK_TYPE) {
            return "Nft Unlock Block";
        }
        return "Unknown Unlock Block";
    }
}

