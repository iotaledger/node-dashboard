import { IPayloadCandidacyAnnouncement } from "./IPayloadCandidacyAnnouncement";
import type { IPayloadSignedTransaction } from "./IPayloadSignedTransaction";
import type { IPayloadTaggedData } from "./IPayloadTaggedData";

/**
 * The global types for the payloads.
 */
export const PAYLOAD_TYPE_TAGGED_DATA = 0;
export const PAYLOAD_TYPE_SIGNED_TRANSACTION = 1;
export const PAYLOAD_TYPE_CANDIDACY_ANNOUNCEMENT = 2;

/**
 * All of the payload types.
 */
export declare type PayloadTypes = IPayloadTaggedData | IPayloadSignedTransaction | IPayloadCandidacyAnnouncement;
