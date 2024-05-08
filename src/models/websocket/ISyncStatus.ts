/* eslint-disable camelcase */
export interface ISyncStatus {
    currentSlot: number;
    currentEpoch: number;
    latestAcceptedBlockSlot: number;
    latestFinalizedSlot: number;
    latestCommitmentSlot: number;
}
