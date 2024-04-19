import type { INodeInfoProtocol } from "./INodeInfoProtocol";
/**
 * Response from the /info endpoint.
 */
export interface INodeInfo {
    /**
     * The name of the node.
     */
    name: string;
    /**
     * The version of node.
     */
    version: string;
    /**
     * The protocol info of the node.
     */
    protocol: INodeInfoProtocol;
}
