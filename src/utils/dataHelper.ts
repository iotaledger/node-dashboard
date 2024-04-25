import { HexEncodedString } from "../models/hexEncodedTypes";
import { IPeer } from "../models/peers/IPeer";

/**
 * Class to help with processing of data.
 */
export class DataHelper {
    /**
     * Computes a slotIndex from a block, transaction or slotCommitment Id.
     * @param id The block, transaction or slotCommitment Id.
     * @returns The slotIndex.
     */
    public static computeSlotIndex(
        id: HexEncodedString
    ): number {
        const numberString = id.slice(-8);
        const chunks = [];

        for (
            let charsLength = numberString.length, i = 0;
            i < charsLength;
            i += 2
        ) {
            chunks.push(numberString.slice(i, i + 2));
        }
        const separated = chunks.map(n => Number.parseInt(n, 16));
        const buf = Uint8Array.from(separated).buffer;
        const view = new DataView(buf);

        return view.getUint32(0, true);
    }

    /**
     * Format the address for the peer.
     * @param peer The peer.
     * @returns The formatted address.
     */
    public static formatPeerAddress(peer: IPeer): string | undefined {
        let address;

        if (peer.multiAddresses) {
            for (let i = 0; i < peer.multiAddresses.length && !address; i++) {
                address = this.extractAddress(peer.multiAddresses[i]);
            }
        }

        return address;
    }

    /**
     * Extract an an address.
     * @param address The address to extract.
     * @returns The formatted address.
     */
    public static extractAddress(address: string): string | undefined {
        let addr = DataHelper.extractIp4(address);

        if (!addr) {
            addr = DataHelper.extractIp6(address);
        }

        if (!addr) {
            addr = DataHelper.extractDns(address);
        }

        return addr;
    }

    /**
     * Extract and format an IPv4 address.
     * @param address The address to extract.
     * @returns The formatted address.
     */
    public static extractIp4(address: string): string | undefined {
        const parts = /\/ip4\/((?:\d{1,3}.){3}\d{1,3})\/tcp\/(\d*)/.exec(address);

        if (parts && parts.length === 3) {
            return `${parts[1]}:${parts[2]}`;
        }
    }

    /**
     * Extract and format an IPv6 address.
     * @param address The address to extract.
     * @returns The formatted address.
     */
    public static extractIp6(address: string): string | undefined {
        const parts = /\/ip6\/(.*?)\/tcp\/(\d*)/.exec(address);

        if (parts && parts.length === 3) {
            return `${parts[1]}:${parts[2]}`;
        }
    }

    /**
     * Extract and format a dns address.
     * @param addr The address to extract.
     * @returns The formatted address.
     */
    public static extractDns(addr: string): string | undefined {
        const parts = /\/dns\/(.*?)\/tcp\/(\d*)/.exec(addr);

        if (parts && parts.length === 3) {
            return `${parts[1]}:${parts[2]}`;
        }
    }

    /**
     * Sort a list of peers.
     * @param peers The peers to sort.
     * @returns The sorted peers.
     */
    public static sortPeers<T extends { connected: boolean; id: string; alias?: string }>(peers: T[]): T[] {
        return peers.sort((a, b) => {
            if (a.connected !== b.connected) {
                return a.connected ? -1 : 1;
            }

            return (a.alias ?? a.id).localeCompare(b.alias ?? b.id);
        });
    }
}
