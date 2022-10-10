import { IProofOfInclusion } from "../../../models/plugins/IProofOfInclusion";

export interface ProofOfInclusionState {
    /**
     * The poi data.
     */
    poi?: IProofOfInclusion;

    /**
     * The id of the poi block.
     */
    blockId?: string;

    /**
     * Is Poi valid.
     */
     isPoiValid?: boolean;

    /**
     * Is the dialog busy.
     */
    dialogBusy?: boolean;

    /**
     * Status message to display in dialog.
     */
    dialogStatus?: string;
}
