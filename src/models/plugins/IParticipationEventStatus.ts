export interface IParticipationEventStatus {
    /**
     * Status of the event
     */
    status: string;

    /**
     * The milestone that confirmed it.
     */
    milestoneIndex: string;
    
    /**
     * The questions status of the voting event.
     */
    questions?: Object[];
    
    /**
     * The status of the staking event.
     */
    staking?: Object;
    
    /**
     * The cheksum of the event.
     */
     checksum: string;

    
    
}