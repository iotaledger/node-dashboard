import { Bech32Helper, ALIAS_ADDRESS_TYPE, ED25519_ADDRESS_TYPE, NFT_ADDRESS_TYPE } from "@iota/iota.js";
import { Converter } from "@iota/util.js";
import { IBech32AddressDetails } from "../models/IBech32AddressDetails";

export class Bech32AddressHelper {
    /**
     * Build the address details.
     * @param address The address to source the data from.
     * @param hrp The human readable part of the address.
     * @param addressType The address type
     * @returns The parts of the address.
     */
    public static buildAddress(address: string, hrp: string, addressType?: number): IBech32AddressDetails {
        let bech32;
        let hex;
        let type;

        if (Bech32Helper.matches(address, hrp)) {
            try {
                const result = Bech32Helper.fromBech32(address, hrp);
                if (result) {
                    bech32 = address;
                    type = result.addressType;
                    hex = Converter.bytesToHex(result.addressBytes);
                }
            } catch {}
        }

        if (!bech32) {
            type = addressType !== undefined ? addressType : Number.parseInt(address.slice(0, 2), 16);
            hex = address;
            bech32 = Bech32Helper.toBech32(type, Converter.hexToBytes(hex), hrp);
        }

        return {
            bech32,
            hex,
            type,
            typeLabel: Bech32AddressHelper.typeLabel(type)
        };
    }

    /**
     * Convert the address type number to a label.
     * @param addressType The address type to get the label for.
     * @returns The label.
     */
    public static typeLabel(addressType?: number): string | undefined {
        if (addressType === ED25519_ADDRESS_TYPE) {
            return "Ed25519";
        } else if (addressType === ALIAS_ADDRESS_TYPE) {
            return "Alias";
        } else if (addressType === NFT_ADDRESS_TYPE) {
            return "Nft";
        }
            return "Unknown address type";
    }
}
