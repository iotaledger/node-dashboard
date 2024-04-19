import type { INodeInfo } from "./info/INodeInfo";
import { IPeer } from "./peers/IPeer";
/**
 * Client interface definition for API communication.
 */
export interface IClient {
    /**
     * Get the info about the node.
     * @returns The node information.
     */
    info(): Promise<INodeInfo>;
    /**
     * Get the list of peers.
     * @returns The list of peers.
     */
    peers(): Promise<IPeer[]>;
    /**
     * Add a new peer.
     * @param multiAddress The address of the peer to add.
     * @param alias An optional alias for the peer.
     * @returns The details for the created peer.
     */
    peerAdd(multiAddress: string, alias?: string): Promise<IPeer>;
    /**
     * Delete a peer.
     * @param peerId The peer to delete.
     * @returns Nothing.
     */
    peerDelete(peerId: string): Promise<void>;
    /**
     * Get a peer.
     * @param peerId The peer to delete.
     * @returns The details for the created peer.
     */
    peer(peerId: string): Promise<IPeer>;
}
