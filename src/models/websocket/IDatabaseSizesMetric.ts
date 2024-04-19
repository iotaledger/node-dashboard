/* eslint-disable camelcase */
export interface IDatabaseSizesMetric {
    permanent: number;
    prunable: number;
    txRetainer: number;
    total: number;
    ts: number;
}
