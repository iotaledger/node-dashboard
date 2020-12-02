/* eslint-disable camelcase */
export interface IPeerHeartbeat {
    solid_milestone_index: number;
    pruned_milestone_index: number;
    latest_milestone_index: number;
    connected_neighbors: number;
    synced_neighbors: number;
}
