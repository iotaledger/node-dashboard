import { IBlock, IBlockMetadata } from "@iota/iota.js";
import { BlockTangleStatus } from "../../../models/blockTangleStatus";

export interface BlockState {
    /**
     * Block.
     */
    block?: IBlock;

    /**
     * Metadata.
     */
    metadata?: IBlockMetadata;

    /**
     * Metadata status.
     */
    metadataStatus?: string;

    /**
     * Reason for the conflict.
     */
    conflictReason?: string;

    /**
     * The block tangle status.
     */
    blockTangleStatus?: BlockTangleStatus;

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
