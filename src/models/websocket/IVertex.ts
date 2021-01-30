/* eslint-disable camelcase */
export interface IVertex {
    id: string;
    parents: string;
    is_solid: boolean;
    is_referenced: boolean;
    is_conflicting: boolean;
    is_milestone: boolean;
    is_tip: boolean;
    is_selected: boolean;
}
