import { INodeInfoProtocolParameter } from "./INodeInfoProtocolParameters";
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
     * The protocol parameters of the node.
     */
    protocolParameters: INodeInfoProtocolParameter[];
}
