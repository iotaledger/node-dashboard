/* eslint-disable camelcase */
export interface IPublicNodeStatus {
    snapshot_index: number;
    pruning_index: number;
    is_healthy: boolean;
    is_synced: boolean;
}
