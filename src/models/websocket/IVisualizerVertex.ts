/* eslint-disable camelcase */
export interface IVisualizerVertex {
    id: string;
    parents: string;
    isSolid: boolean;
    isAccepted: boolean;
    isReferenced: boolean;
    isConflicting: boolean;
    isTransaction: boolean;
    isMilestone: boolean;
    isTip: boolean;

    // info set by the visualizer itself
    isSelected: boolean;
}
