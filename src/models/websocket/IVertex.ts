/* eslint-disable camelcase */
export interface IVertex {
    id: string;
    is_milestone: boolean;
    is_referenced: boolean;
    is_solid: boolean;
    is_tip: boolean;
    parent1_id: string;
    parent2_id: string;
}
