import { serializeBlock, CONFLICT_REASON_STRINGS, IBlockMetadata, TAGGED_DATA_PAYLOAD_TYPE, MILESTONE_PAYLOAD_TYPE, TRANSACTION_PAYLOAD_TYPE } from "@iota/iota.js";
import { WriteStream } from "@iota/util.js";
import React, { ReactNode } from "react";
import { Link, RouteComponentProps } from "react-router-dom";
import { ReactComponent as ChevronDownIcon } from "../../../assets/chevron-down.svg";
import { ReactComponent as ChevronLeftIcon } from "../../../assets/chevron-left.svg";
import { ReactComponent as DownloadIcon } from "../../../assets/download.svg";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { BlockTangleStatus } from "../../../models/blockTangleStatus";
import { TangleService } from "../../../services/tangleService";
import { ClipboardHelper } from "../../../utils/clipboardHelper";
import { DownloadHelper } from "../../../utils/downloadHelper";
import AsyncComponent from "../../components/layout/AsyncComponent";
import BlockButton from "../../components/layout/BlockButton";
import Spinner from "../../components/layout/Spinner";
import BlockTangleState from "../../components/tangle/BlockTangleState";
import InclusionState from "../../components/tangle/InclusionState";
import MilestonePayload from "../../components/tangle/MilestonePayload";
import TaggedDataPayload from "../../components/tangle/TaggedDataPayload";
import TransactionPayload from "../../components/tangle/TransactionPayload";
import "./Block.scss";
import { BlockRouteProps } from "./BlockRouteProps";
import { BlockState } from "./BlockState";

/**
 * Component which will show the block page.
 */
class Block extends AsyncComponent<RouteComponentProps<BlockRouteProps>, BlockState> {
    /**
     * Service for tangle requests.
     */
    private readonly _tangleService: TangleService;

    /**
     * Timer to check to state update.
     */
    private _timerId?: NodeJS.Timer;

    /**
     * Create a new instance of Block.
     * @param props The props.
     */
    constructor(props: RouteComponentProps<BlockRouteProps>) {
        super(props);

        this._tangleService = ServiceFactory.get<TangleService>("tangle");

        this.state = {
            childrenBusy: true,
            dataUrls: {},
            selectedDataUrl: "json"
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        super.componentDidMount();

        const result = await this._tangleService.search(this.props.match.params.blockId);

        if (result?.block) {
            const writeStream = new WriteStream();
            serializeBlock(writeStream, result.block);
            const finalBytes = writeStream.finalBytes();

            const dataUrls = {
                json: DownloadHelper.createJsonDataUrl(result.block),
                bin: DownloadHelper.createBinaryDataUrl(finalBytes),
                base64: DownloadHelper.createBase64DataUrl(finalBytes),
                hex: DownloadHelper.createHexDataUrl(finalBytes)
            };

            this.setState({
                block: result.block,
                dataUrls
            }, async () => {
                await this.updateBlockDetails();
            });
        } else if (result?.unavailable) {
            this.props.history.replace("/explorer/unavailable");
        } else {
            this.props.history.replace(`/explorer/search/${this.props.match.params.blockId}`);
        }
    }

    /**
     * The component will unmount so update flag.
     */
    public componentWillUnmount(): void {
        super.componentWillUnmount();
        if (this._timerId) {
            clearTimeout(this._timerId);
            this._timerId = undefined;
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="block">
                <div className="content">
                    <Link
                        to="/explorer"
                        className="row middle inline"
                    >
                        <ChevronLeftIcon className="secondary" />
                        <h3 className="secondary margin-l-s">Back to Explorer</h3>
                    </Link>
                    <div className="card margin-t-m padding-l">
                        <div className="row phone-down-column start">
                            <h2 className="margin-r-l">
                                Block
                            </h2>
                            {this.state.blockTangleStatus && (
                                <BlockTangleState
                                    status={this.state.blockTangleStatus}
                                    milestoneIndex={this.state.metadata?.referencedByMilestoneIndex}
                                    onClick={this.state.metadata?.referencedByMilestoneIndex
                                        ? () => this.props.history.push(
                                            `/explorer/search/${this.state.metadata?.referencedByMilestoneIndex}`)
                                        : undefined}
                                />
                            )}
                        </div>
                        <div className="card--label">
                            Id
                        </div>
                        <div className="card--value card--value__mono row">
                            <span className="margin-r-t">{this.props.match.params.blockId}</span>
                            <BlockButton
                                onClick={() => ClipboardHelper.copy(
                                    this.props.match.params.blockId
                                )}
                                buttonType="copy"
                                labelPosition="top"
                            />
                        </div>
                        {this.state.block?.parents?.map((parent, idx) => (
                            <React.Fragment key={idx}>
                                <div className="card--label">
                                    Parent Block {idx + 1}
                                </div>
                                <div className="card--value card--value__mono row">
                                    {parent !== "0".repeat(64) && (
                                        <React.Fragment>
                                            <Link
                                                className="margin-r-t"
                                                to={
                                                    `/explorer/block/${parent}`
                                                }
                                            >
                                                {parent}
                                            </Link>
                                            <BlockButton
                                                onClick={() => ClipboardHelper.copy(
                                                    parent
                                                )}
                                                buttonType="copy"
                                                labelPosition="top"
                                            />
                                        </React.Fragment>
                                    )}
                                    {parent === "0".repeat(64) && (
                                        <span>Genesis</span>
                                    )}
                                </div>
                            </React.Fragment>
                        ))}
                        <div className="card--label">
                            Nonce
                        </div>
                        <div className="card--value row">
                            <span className="margin-r-t">{this.state.block?.nonce}</span>
                        </div>
                    </div>
                    <div className="card margin-t-m padding-l">
                        <h2>
                            Metadata
                        </h2>
                        {!this.state.metadata && !this.state.metadataStatus && (
                            <Spinner />
                        )}
                        {this.state.metadataStatus && (
                            <p className="margin-t-s danger">{this.state.metadataStatus}</p>
                        )}
                        {this.state.metadata && (
                            <React.Fragment>
                                <div className="card--label">
                                    Is Solid
                                </div>
                                <div className="card--value row">
                                    <span className="margin-r-t">
                                        {this.state.metadata?.isSolid ? "Yes" : "No"}
                                    </span>
                                </div>
                                <div className="card--label">
                                    Ledger Inclusion
                                </div>
                                <div className="card--value row">
                                    <InclusionState state={this.state.metadata?.ledgerInclusionState} />
                                </div>
                                {this.state.conflictReason && (
                                    <React.Fragment>
                                        <div className="card--label">
                                            Conflict Reason
                                        </div>
                                        <div className="card--value">
                                            {this.state.conflictReason}
                                        </div>
                                    </React.Fragment>
                                )}
                            </React.Fragment>
                        )}
                    </div>
                    {this.state.block?.payload && (
                        <React.Fragment>
                            {this.state.block.payload.type === TRANSACTION_PAYLOAD_TYPE && (
                                <React.Fragment>
                                    <TransactionPayload payload={this.state.block.payload} />
                                    {this.state.block.payload.essence.payload && (
                                        <div className="card margin-t-m padding-l">
                                            <TaggedDataPayload
                                                payload={this.state.block.payload.essence.payload}
                                            />
                                        </div>
                                    )}
                                </React.Fragment>
                            )}
                            {this.state.block.payload.type === MILESTONE_PAYLOAD_TYPE && (
                                <div className="card margin-t-m padding-l">
                                    <MilestonePayload payload={this.state.block.payload} />
                                </div>
                            )}
                            {this.state.block.payload.type === TAGGED_DATA_PAYLOAD_TYPE && (
                                <div className="card margin-t-m padding-l">
                                    <TaggedDataPayload payload={this.state.block.payload} />
                                </div>
                            )}
                        </React.Fragment>
                    )}
                    <div className="card margin-t-s padding-l">
                        <div className="row margin-b-s">
                            <h2>Tools</h2>
                        </div>
                        <div className="card--label">
                            Export Block
                        </div>
                        <div className="card--value row">
                            <div className="select-wrapper">
                                <select
                                    value={this.state.selectedDataUrl}
                                    onChange={e => this.setState(
                                        { selectedDataUrl: e.target.value })}
                                >
                                    <option value="json">JSON</option>
                                    <option value="bin">Binary</option>
                                    <option value="hex">Hex</option>
                                    <option value="base64">Base64</option>
                                </select>
                                <ChevronDownIcon />
                            </div>
                            <a
                                className="card--action card--action-plain"
                                href={this.state.dataUrls[this.state.selectedDataUrl]}
                                download={DownloadHelper.filename(
                                    this.props.match.params.blockId, this.state.selectedDataUrl)}
                                role="button"
                            >
                                <DownloadIcon />
                            </a>
                        </div>
                    </div>
                    <div className="card margin-t-s padding-l">
                        <div className="row margin-b-s">
                            <h2>Child Blocks</h2>
                            {this.state.childrenIds !== undefined && (
                                <span className="card--header-count">
                                    {this.state.childrenIds.length}
                                </span>
                            )}
                        </div>
                        {this.state.childrenBusy && (<Spinner />)}
                        {this.state.childrenIds?.map(childId => (
                            <div className="card--value card--value__mono margin-b-s" key={childId}>
                                <Link
                                    to={
                                        `/explorer/block/${childId}`
                                    }
                                >
                                    {childId}
                                </Link>
                            </div>
                        ))}
                        {!this.state.childrenBusy &&
                            this.state.childrenIds &&
                            this.state.childrenIds.length === 0 && (
                                <p>There are no children for this block.</p>
                            )}
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Update the block details.
     */
    private async updateBlockDetails(): Promise<void> {
        const details = await this._tangleService.blockDetails(this.props.match.params.blockId);

        this.setState({
            metadata: details?.metadata,
            conflictReason: this.calculateConflictReason(details?.metadata),
            childrenIds: details?.childrenIds && details?.childrenIds.length > 0
                ? details?.childrenIds : (this.state.childrenIds ?? []),
            blockTangleStatus: this.calculateStatus(details?.metadata),
            childrenBusy: false,
            metadataStatus: details?.unavailable ? "The node is currently unavailable or is not synced" : undefined
        });

        if (!details?.unavailable &&
            (!details?.metadata?.referencedByMilestoneIndex || !details?.metadata?.milestoneIndex)) {
            this._timerId = setTimeout(async () => {
                await this.updateBlockDetails();
            }, 10000);
        }
    }

    /**
     * Calculate the status for the block.
     * @param metadata The metadata to calculate the status from.
     * @returns The block status.
     */
    private calculateStatus(metadata?: IBlockMetadata): BlockTangleStatus {
        let blockTangleStatus: BlockTangleStatus = "unknown";

        if (metadata) {
            if (metadata.milestoneIndex) {
                blockTangleStatus = "milestone";
            } else if (metadata.referencedByMilestoneIndex) {
                blockTangleStatus = "referenced";
            } else {
                blockTangleStatus = "pending";
            }
        }

        return blockTangleStatus;
    }

    /**
     * Calculate the conflict reason for the block.
     * @param metadata The metadata to calculate the conflict reason from.
     * @returns The conflict reason.
     */
    private calculateConflictReason(metadata?: IBlockMetadata): string {
        let conflictReason: string = "";

        if (metadata?.ledgerInclusionState === "conflicting") {
            conflictReason = metadata.conflictReason && CONFLICT_REASON_STRINGS[metadata.conflictReason]
                ? CONFLICT_REASON_STRINGS[metadata.conflictReason]
                : "The reason for the conflict is unknown";
        }

        return conflictReason;
    }
}

export default Block;
