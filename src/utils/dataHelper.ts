import { Converter, WriteStream, Blake2b, IMessage, IPeer, serializeMessage } from "@iota/iota.js";
import { INodeStatus } from "../models/websocket/INodeStatus";

/**
 * Class to help with processing of data.
 */
export class DataHelper {
    /**
     * Calculate the memory usage.
     * @param status The status.
     * @returns The calculate memory usage.
     */
    public static calculateMemoryUsage(status: INodeStatus): number {
        return status.mem.heap_inuse +
            (status.mem.heap_idle - status.mem.heap_released) +
            status.mem.m_span_inuse +
            status.mem.m_cache_inuse +
            status.mem.stack_sys;
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
    public static sortPeers<T extends { health: number; id: string; alias?: string }>(peers: T[]): T[] {
        return peers.sort((a, b) => {
            if (a.health !== b.health) {
                return b.health - a.health;
            }

            return (a.alias ?? a.id).localeCompare(b.alias ?? b.id);
        });
    }

    /**
     * Calculate the health of the peer.
     * @param peer The peer to calculate the health of.
     * @param confirmedMilestoneIndex Confirmed milestone index of the node.
     * @param latestMilestoneIndex Latest milestone index of the node.
     * @returns The health.
     */
    public static calculateHealth(peer: IPeer, confirmedMilestoneIndex: number, latestMilestoneIndex: number): number {
        let health = 0;

        if (peer.connected) {
            health = (DataHelper.calculateIsSynced(peer, latestMilestoneIndex) &&
                peer.gossip?.heartbeat &&
                peer.gossip?.heartbeat?.prunedMilestoneIndex < confirmedMilestoneIndex) ? 2 : 1;
        }

        return health;
    }

    /**
     * Calculate the sync status of the peer.
     * @param peer The peer to calculate the sync status of.
     * @param latestMilestoneIndex Latest milestone index of the node.
     * @returns The sync status.
     */
    public static calculateIsSynced(peer: IPeer, latestMilestoneIndex: number): boolean {
        let isSynced = false;

        if (peer.gossip?.heartbeat) {
            const latestKnownMilestoneIndex = (latestMilestoneIndex < peer.gossip.heartbeat.latestMilestoneIndex)
                ? peer.gossip.heartbeat.latestMilestoneIndex : latestMilestoneIndex;

            if (peer.gossip.heartbeat.solidMilestoneIndex >= (latestKnownMilestoneIndex - 2)) {
                isSynced = true;
            }
        }

        return isSynced;
    }

    /**
     * Calculate messageId from a message.
     * @param message The message.
     * @returns The message.
     */
    public static calculateMessageId(message: IMessage): string {
        const writeStream = new WriteStream();
        serializeMessage(writeStream, message);
        const messageBytes = writeStream.finalBytes();

        return Converter.bytesToHex(Blake2b.sum256(messageBytes));
    }
}
