import { BlockTangleStatus } from "../../../models/blockTangleStatus";

export interface BlockTangleStateProps {
    /**
     * The tangle status.
     */
    status?: BlockTangleStatus;

    /**
     * The milestone that confirmed it.
     */
    milestoneIndex?: number;

    /**
     * The button click.
     */
    onClick?(): void;
}
