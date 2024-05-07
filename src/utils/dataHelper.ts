import { HexEncodedString } from "../models/hexEncodedTypes";

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
