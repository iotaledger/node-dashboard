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
    questions?: { answers: {value: number; current: number; accumulated: number}[] }[];

    /**
     * The status of the staking event.
     */
    staking?: { staked: number; rewarded: number; symbol: string };

    /**
     * The cheksum of the event.
     */
     checksum: string;
}

