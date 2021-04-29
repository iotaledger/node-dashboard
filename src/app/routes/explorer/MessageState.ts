import { IMessage, IMessageMetadata } from "@iota/iota.js";
import { MessageTangleStatus } from "../../../models/messageTangleStatus";

export interface MessageState {
    /**
     * Message.
     */
    message?: IMessage;

    /**
     * Metadata.
     */
    metadata?: IMessageMetadata;

    /**
     * Metadata status.
     */
    metadataStatus?: string;

    /**
     * Reason for the conflict.
     */
    conflictReason?: string;

    /**
     * Are we busy loading the children.
     */
    childrenBusy: boolean;

    /**
     * The children ids.
     */
    childrenIds?: string[];

    /**
     * The message tangle status.
     */
    messageTangleStatus?: MessageTangleStatus;

    /**
     * The data urls.
     */
    dataUrls: {
        [id: string]: string;
    };

    /**
     * The selected data url.
     */
    selectedDataUrl: string;
}
