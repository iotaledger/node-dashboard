import { IMilestonePayload } from "../payloads/IMilestonePayload";
import { ITaggedDataPayload } from "../payloads/ITaggedDataPayload";
import { ITransactionPayload } from "../payloads/ITransactionPayload";

export interface IVertex {
    /**
     * What is the id for the vertex.
     */
    fullId?: string;

    /**
     * What is the short id for the vertex.
     */
    shortId: string;

    /**
     * Parent Ids.
     */
    parents?: string;

    payload?: IMilestonePayload | ITaggedDataPayload | ITransactionPayload;

    /**
     * Is the block solid.
     */
    isSolid?: boolean;

    /**
     * Is it a transaction.
     */
    isTransaction?: boolean;

    /**
     * Is the block conflicting.
     */
    isConflicting?: boolean;

    /**
     * Is the block referenced.
     */
    isReferenced?: boolean;

    /**
     * Is it a milestone.
     */
    isMilestone?: boolean;

    /**
     * Is it a tip.
     */
    isTip?: boolean;

    /**
     * Is it selected.
     */
    isSelected?: boolean;
}
