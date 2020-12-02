/* eslint-disable camelcase */
import { IPeerHeartbeat } from "./IPeerHeartbeat";
import { IPeerInfo } from "./IPeerInfo";

export interface IPeerMetric {
    identity: string;
    alias: string;
    origin_addr: string;
    connection_origin: number;
    protocol_version: number;
    bytes_read: number;
    bytes_written: number;
    heartbeat: IPeerHeartbeat;
    info: IPeerInfo;
    connected: boolean;
    ts: number;
}
