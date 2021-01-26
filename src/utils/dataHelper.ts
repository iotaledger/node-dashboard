import { IPeer } from "@iota/iota.js";
import { IStatus } from "../models/websocket/IStatus";

/**
 * Class to help with processing of data.
 */
export class DataHelper {
    /**
     * Calculate the memory usage.
     * @param status The status.
     * @returns The calculate memory usage.
     */
    public static calculateMemoryUsage(status: IStatus): number {
        return status.mem.heap_inuse +
            (status.mem.heap_idle - status.mem.heap_released) +
            status.mem.m_span_inuse +
            status.mem.m_cache_inuse +
            status.mem.stack_sys;
    }

    /**
     * Format the name for the peer.
     * @param peer The peer.
     * @returns The formatted name.
     */
    public static formatPeerName(peer: IPeer): string {
        let name = "";

        if (peer.alias) {
            name += peer.alias;
        } else if (peer.id) {
            name += peer.id;
        }

        return name;
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
    public static sortPeers<T extends { health: number; name: string }>(peers: T[]): T[] {
        return peers.sort((a, b) => {
            if (a.health !== b.health) {
                return b.health - a.health;
            }

            return a.name.localeCompare(b.name);
        });
    }

    /**
     * Calculate the health of the peer.
     * @param peer The peer to calculate the health of.
     * @returns The health.
     */
    public static calculateHealth(peer: IPeer): number {
        let health = 0;

        if (peer.connected) {
            health = DataHelper.calculateIsSynced(peer) ? 2 : 1;
        }

        return health;
    }

    /**
     * Calculate the sync status of the peer.
     * @param peer The peer to calculate the sync status of.
     * @returns The sync status.
     */
    public static calculateIsSynced(peer: IPeer): boolean {
        let isSynced = false;

        if (peer.gossip?.heartbeat &&
            peer.gossip.heartbeat.solidMilestoneIndex >= (peer.gossip.heartbeat.latestMilestoneIndex - 2)) {
            isSynced = true;
        }

        return isSynced;
    }
}
