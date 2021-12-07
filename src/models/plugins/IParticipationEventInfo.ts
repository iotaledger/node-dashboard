import { IParticipationEventStatus } from './IParticipationEventStatus';

export interface IParticipationEventInfo {
    /**
     * Name of the event
     */
    name: string;

    /**
     * The confirmed milestone index.
     */
    milestoneIndexCommence: string;
    
    /**
     * The start milestone index.
     */
    milestoneIndexStart: string;
    
    /**
     * The end milestone index.
     */
    milestoneIndexEnd: string;
    
    /**
     * The event info payload.
     */
    payload: any;
    
    /**
     * The event info payload.
     */
    additionalInfo: string;
    
    /**
     * The event info payload.
     */
    status?: IParticipationEventStatus;
    
}