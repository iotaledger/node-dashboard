import { SIGNATURE_UNLOCK_BLOCK_TYPE, REFERENCE_UNLOCK_BLOCK_TYPE, ALIAS_UNLOCK_BLOCK_TYPE, NFT_UNLOCK_BLOCK_TYPE,
    UTXO_INPUT_TYPE, TREASURY_INPUT_TYPE,
    BASIC_OUTPUT_TYPE, ALIAS_OUTPUT_TYPE, NFT_OUTPUT_TYPE, FOUNDRY_OUTPUT_TYPE, TREASURY_OUTPUT_TYPE,
    ADDRESS_UNLOCK_CONDITION_TYPE, STORAGE_DEPOSIT_RETURN_UNLOCK_CONDITION_TYPE,
    TIMELOCK_UNLOCK_CONDITION_TYPE, EXPIRATION_UNLOCK_CONDITION_TYPE,
    STATE_CONTROLLER_ADDRESS_UNLOCK_CONDITION_TYPE, GOVERNOR_ADDRESS_UNLOCK_CONDITION_TYPE,
    IMMUTABLE_ALIAS_UNLOCK_CONDITION_TYPE,
    ED25519_ADDRESS_TYPE, ALIAS_ADDRESS_TYPE, NFT_ADDRESS_TYPE,
    ISSUER_FEATURE_BLOCK_TYPE, METADATA_FEATURE_BLOCK_TYPE,
    SENDER_FEATURE_BLOCK_TYPE, TAG_FEATURE_BLOCK_TYPE } from "@iota/iota.js";

export class NameHelper {
    /**
     * Get the name for the address type.
     * @param type The type to get the name for.
     * @returns The address type name.
     */
     public static getAddressTypeName(type: number): string {
        if (type === ED25519_ADDRESS_TYPE) {
            return "Address";
        } else if (type === ALIAS_ADDRESS_TYPE) {
            return "Alias address";
        } else if (type === NFT_ADDRESS_TYPE) {
            return "NFT address";
        }
        return "Unknown Address Type";
    }

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

    /**
     * Get the name for the unlock condition type.
     * @param type The type to get the name for.
     * @returns The unlock condition type name.
     */
    public static getUnlockConditionTypeName(type: number): string {
        if (type === ADDRESS_UNLOCK_CONDITION_TYPE) {
            return "Address Unlock Condition";
        } else if (type === STORAGE_DEPOSIT_RETURN_UNLOCK_CONDITION_TYPE) {
            return "Storage Desposit Return Unlock Condition";
        } else if (type === TIMELOCK_UNLOCK_CONDITION_TYPE) {
            return "Timelock Unlock Condition";
        } else if (type === EXPIRATION_UNLOCK_CONDITION_TYPE) {
            return "Expiration Unlock Condition";
        } else if (type === STATE_CONTROLLER_ADDRESS_UNLOCK_CONDITION_TYPE) {
            return "State Controller Address Unlock Condition";
        } else if (type === GOVERNOR_ADDRESS_UNLOCK_CONDITION_TYPE) {
            return "Governor Unlock Condition";
        } else if (type === IMMUTABLE_ALIAS_UNLOCK_CONDITION_TYPE) {
            return "Immutable Alias Unlock Condition";
        }
        return "Unknown Unlock Condition";
    }

    /**
     * Get the name for the feature block type.
     * @param type The type to get the name for.
     * @returns The feature block type name.
     */
    public static getFeatureBlockTypeName(type: number): string {
        if (type === SENDER_FEATURE_BLOCK_TYPE) {
            return "Sender Feature Block";
        } else if (type === ISSUER_FEATURE_BLOCK_TYPE) {
            return "Issuer Feature Block";
        } else if (type === METADATA_FEATURE_BLOCK_TYPE) {
            return "Metadata Feature Block";
        } else if (type === TAG_FEATURE_BLOCK_TYPE) {
            return "Tag Feature Block";
        }
        return "Unknown Feature Block";
    }
}
