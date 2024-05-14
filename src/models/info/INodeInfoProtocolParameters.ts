import type { INodeInfoProtocolParameterParameters } from "./INodeInfoProtocol";

/**
 * The Protocol Info.
 */
export interface INodeInfoProtocolParameter {
    /**
     * The start epoch for the protocol parameters.
     */
    startEpoch: number;
    /**
     * The protocol parameters.
     */
    parameters: INodeInfoProtocolParameterParameters;
}
