import { IParticipationEventInfo } from "../../../models/plugins/participation/IParticipationEventInfo";

export interface ParticipationState {
    /**
     * The events.
     */
    events: {
        [id: string]: IParticipationEventInfo;
    };

    /**
     * The eventIds.
     */
    eventIds: string[];

    /**
     * JSON string that contains the event info that is to be added.
     */
    eventInfo?: string;

    /**
     * The id of the event to delete.
     */
    deleteId?: string;

    /**
     * The event to show in More details dialog.
     */
    dialogDetailsEvent?: IParticipationEventInfo;

    /**
     * The type of dialog to show.
     */
    dialogType?: "add" | "delete" | "details";

    /**
     * Is the dialog busy.
     */
    dialogBusy?: boolean;

    /**
     * Status message to display in dialog.
     */
    dialogStatus?: string;
}
