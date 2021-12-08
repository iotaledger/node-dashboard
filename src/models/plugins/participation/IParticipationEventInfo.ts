import { IParticipationEventPayload } from "./IParticipationEventPayload";
import { IParticipationEventStatus } from "./IParticipationEventStatus";

export interface IParticipationEventInfo {
    /**
     * The Event name
     */
    name: string;

    /**
     * The milestone where the event commences.
     */
    milestoneIndexCommence: string;

    /**
     * The milestone where the event enters holding phase.
     */
    milestoneIndexStart: string;

    /**
     * The milestone where the event ends.
     */
    milestoneIndexEnd: string;

    /**
     * The event info payload.
     */
    payload: IParticipationEventPayload;

    /**
     * Additional information.
     */
    additionalInfo: string;

    /**
     * The status of the event.
     */
    status?: IParticipationEventStatus;

}
