import { IParticipationEventAnswer } from "./IParticipationEventAnswer";

export interface IParticipationEventQuestion {
    /**
     * The text of the question
     */
    text: string;

    /**
     * A possible answer for the question
     */
    answers: IParticipationEventAnswer[];

    /**
     * Additional information about the question
     */
    additionalInfo: number;
}
