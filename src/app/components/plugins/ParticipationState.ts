import { IParticipationEventInfo } from './../../../models/plugins/IParticipationEventInfo';

export interface ParticipationState {
    /**
     * The events.
     */
    events: {
        [id: string]: IParticipationEventInfo | any;
    };
    
    /**
     * The eventIds.
     */
    eventIds: string[];

    /**
     * JSON string that contains the event info.
     */
    eventInfo: string;
    
    /**
     * URL returning JSON string of the event info.
     */
    eventInfoUrl: string;
    
    /**
     * The id of the event to delete.
     */
    deleteId?: string;
    
    /**
     * Show details of the event based on Id.
     */
    detailsId?: string;

    /**
     * The type of dialog to show.
     */
    dialogType?: "add" | "delete" | "details";

    /**
     * Is the dialog edit type.
     */
    dialogIsAdd?: boolean;

    /**
     * Is the dialog busy.
     */
    dialogBusy?: boolean;

    /**
     * Status message to display in dialog.
     */
    dialogStatus?: string;
}
