/* eslint-disable camelcase */
export interface IVertex {
    id: string;
    parents: string;
    isSolid: boolean;
    isReferenced: boolean;
    isMilestone: boolean;
    isTip: boolean;

    // info set by the visualizer itself
    isConflicting: boolean;
    isSelected: boolean;
}
