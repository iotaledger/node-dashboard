import { IParticipationEventQuestion } from "./IParticipationEventQuestion";

export interface IParticipationEventPayload {
    /**
     * type of payload
     */
    type: number;

    /**
     *  Ballot questions
     */
    questions?: IParticipationEventQuestion[];

    /**
     * The description text of the staking event
     */
    text?: string;

    /**
     * The symbol in UTF-8 format
     */
    symbol?: string;

    /**
     * The numerator used in the calculation of staking rewards.
     */
    numerator?: number;

    /**
     * The denominator used in the calculation of staking rewards.
     */
    denominator?: number;

    /**
     * The denominator used in the calculation of staking rewards.
     */
    requiredMinimumRewards?: number;

    /**
     * Additional information
     */
     additionalInfo?: string;
}
