/* eslint-disable camelcase */
export interface IVisualizerVertex {
    id: string;
    parents: string;
    blockState: string;
    isBasicBlockTaggedData: boolean;
    isBasicBlockSignedTransaction: boolean;
    isBasicBlockCandidacyAnnouncement: boolean;
    isValidationBlock: boolean;
    isTip: boolean;
}
