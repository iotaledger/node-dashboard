import { IPoi } from "../../../models/plugins/IPoi";

export interface PoiState {
    /**
     * Is the dialog busy.
     */
    jsonData?: IPoi;

    /**
     * Is the dialog busy.
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
