/* eslint-disable camelcase */
export interface IVertex {
    id: string;
    parents: string;
    isSolid: boolean;
    isReferenced: boolean;
    isTransaction: boolean;
    isConflicting: boolean;
    isMilestone: boolean;
    isTip: boolean;

    // info set by the visualizer itself
    isSelected: boolean;
}
