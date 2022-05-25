/* eslint-disable camelcase */
export interface IPublicNodeStatus {
    snapshotIndex: number;
    pruningIndex: number;
    isHealthy: boolean;
    isSynced: boolean;
}
