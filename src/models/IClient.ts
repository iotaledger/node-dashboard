import { HexEncodedString } from "./hexEncodedTypes";
import type { INodeInfo } from "./info/INodeInfo";
import { IPeer } from "./peers/IPeer";
import { IBlock } from "./tangle/IBlock";
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
     * Get the block data by id.
     * @param blockId The block to get the data for.
     * @returns The block data.
     */
    block(blockId: HexEncodedString): Promise<IBlock>;
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
}
