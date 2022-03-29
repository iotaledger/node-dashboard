import { CONFLICT_REASON_STRINGS, IMessageMetadata, TAGGED_DATA_PAYLOAD_TYPE, MILESTONE_PAYLOAD_TYPE, serializeMessage, TRANSACTION_PAYLOAD_TYPE } from "@iota/iota.js";
import { WriteStream } from "@iota/util.js";
import React, { ReactNode } from "react";
import { Link, RouteComponentProps } from "react-router-dom";
import { ReactComponent as ChevronDownIcon } from "../../../assets/chevron-down.svg";
import { ReactComponent as ChevronLeftIcon } from "../../../assets/chevron-left.svg";
import { ReactComponent as DownloadIcon } from "../../../assets/download.svg";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { MessageTangleStatus } from "../../../models/messageTangleStatus";
import { TangleService } from "../../../services/tangleService";
import { ClipboardHelper } from "../../../utils/clipboardHelper";
import { DownloadHelper } from "../../../utils/downloadHelper";
import AsyncComponent from "../../components/layout/AsyncComponent";
import MessageButton from "../../components/layout/MessageButton";
import Spinner from "../../components/layout/Spinner";
import InclusionState from "../../components/tangle/InclusionState";
import IndexationPayload from "../../components/tangle/IndexationPayload";
import MessageTangleState from "../../components/tangle/MessageTangleState";
import MilestonePayload from "../../components/tangle/MilestonePayload";
import ReceiptPayload from "../../components/tangle/ReceiptPayload";
import TransactionPayload from "../../components/tangle/TransactionPayload";
import "./Message.scss";
import { MessageRouteProps } from "./MessageRouteProps";
import { MessageState } from "./MessageState";

/**
 * Component which will show the message page.
 */
class Message extends AsyncComponent<RouteComponentProps<MessageRouteProps>, MessageState> {
    /**
     * Service for tangle requests.
     */
    private readonly _tangleService: TangleService;

    /**
     * Timer to check to state update.
     */
    private _timerId?: NodeJS.Timer;

    /**
     * Create a new instance of Message.
     * @param props The props.
     */
    constructor(props: RouteComponentProps<MessageRouteProps>) {
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

        const result = await this._tangleService.search(this.props.match.params.messageId);

        if (result?.message) {
            const writeStream = new WriteStream();
            serializeMessage(writeStream, result.message);
            const finalBytes = writeStream.finalBytes();

            const dataUrls = {
                json: DownloadHelper.createJsonDataUrl(result.message),
                bin: DownloadHelper.createBinaryDataUrl(finalBytes),
                base64: DownloadHelper.createBase64DataUrl(finalBytes),
                hex: DownloadHelper.createHexDataUrl(finalBytes)
            };

            this.setState({
                message: result.message,
                dataUrls
            }, async () => {
                await this.updateMessageDetails();
            });
        } else if (result?.unavailable) {
            this.props.history.replace("/explorer/unavailable");
        } else {
            this.props.history.replace(`/explorer/search/${this.props.match.params.messageId}`);
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
            <div className="message">
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
                                Message
                            </h2>
                            {this.state.messageTangleStatus && (
                                <MessageTangleState
                                    status={this.state.messageTangleStatus}
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
                            <span className="margin-r-t">{this.props.match.params.messageId}</span>
                            <MessageButton
                                onClick={() => ClipboardHelper.copy(
                                    this.props.match.params.messageId
                                )}
                                buttonType="copy"
                                labelPosition="top"
                            />
                        </div>
                        {this.state.message?.parentMessageIds?.map((parent, idx) => (
                            <React.Fragment key={idx}>
                                <div className="card--label">
                                    Parent Message {idx + 1}
                                </div>
                                <div className="card--value card--value__mono row">
                                    {parent !== "0".repeat(64) && (
                                        <React.Fragment>
                                            <Link
                                                className="margin-r-t"
                                                to={
                                                    `/explorer/message/${parent}`
                                                }
                                            >
                                                {parent}
                                            </Link>
                                            <MessageButton
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
                            <span className="margin-r-t">{this.state.message?.nonce}</span>
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
                    {this.state.message?.payload && (
                        <React.Fragment>
                            {this.state.message.payload.type === TRANSACTION_PAYLOAD_TYPE && (
                                <React.Fragment>
                                    <TransactionPayload payload={this.state.message.payload} />
                                    {this.state.message.payload.essence.payload && (
                                        <div className="card margin-t-m padding-l">
                                            <IndexationPayload
                                                payload={this.state.message.payload.essence.payload}
                                            />
                                        </div>
                                    )}
                                </React.Fragment>
                            )}
                            {this.state.message.payload.type === MILESTONE_PAYLOAD_TYPE && (
                                <React.Fragment>
                                    <div className="card margin-t-m padding-l">
                                        <MilestonePayload payload={this.state.message.payload} />
                                    </div>
                                    {this.state.message.payload.receipt && (
                                        <div className="card margin-t-m padding-l">
                                            <ReceiptPayload payload={this.state.message.payload.receipt} />
                                        </div>
                                    )}
                                </React.Fragment>
                            )}
                            {this.state.message.payload.type === TAGGED_DATA_PAYLOAD_TYPE && (
                                <div className="card margin-t-m padding-l">
                                    <IndexationPayload payload={this.state.message.payload} />
                                </div>
                            )}
                        </React.Fragment>
                    )}
                    <div className="card margin-t-s padding-l">
                        <div className="row margin-b-s">
                            <h2>Tools</h2>
                        </div>
                        <div className="card--label">
                            Export Message
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
                                    this.props.match.params.messageId, this.state.selectedDataUrl)}
                                role="button"
                            >
                                <DownloadIcon />
                            </a>
                        </div>
                    </div>
                    <div className="card margin-t-s padding-l">
                        <div className="row margin-b-s">
                            <h2>Child Messages</h2>
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
                                        `/explorer/message/${childId}`
                                    }
                                >
                                    {childId}
                                </Link>
                            </div>
                        ))}
                        {!this.state.childrenBusy &&
                            this.state.childrenIds &&
                            this.state.childrenIds.length === 0 && (
                                <p>There are no children for this message.</p>
                            )}
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Update the message details.
     */
    private async updateMessageDetails(): Promise<void> {
        const details = await this._tangleService.messageDetails(this.props.match.params.messageId);

        this.setState({
            metadata: details?.metadata,
            conflictReason: this.calculateConflictReason(details?.metadata),
            childrenIds: details?.childrenIds && details?.childrenIds.length > 0
                ? details?.childrenIds : (this.state.childrenIds ?? []),
            messageTangleStatus: this.calculateStatus(details?.metadata),
            childrenBusy: false,
            metadataStatus: details?.unavailable ? "The node is currently unavailable or is not synced" : undefined
        });

        if (!details?.unavailable &&
            (!details?.metadata?.referencedByMilestoneIndex || !details?.metadata?.milestoneIndex)) {
            this._timerId = setTimeout(async () => {
                await this.updateMessageDetails();
            }, 10000);
        }
    }

    /**
     * Calculate the status for the message.
     * @param metadata The metadata to calculate the status from.
     * @returns The message status.
     */
    private calculateStatus(metadata?: IMessageMetadata): MessageTangleStatus {
        let messageTangleStatus: MessageTangleStatus = "unknown";

        if (metadata) {
            if (metadata.milestoneIndex) {
                messageTangleStatus = "milestone";
            } else if (metadata.referencedByMilestoneIndex) {
                messageTangleStatus = "referenced";
            } else {
                messageTangleStatus = "pending";
            }
        }

        return messageTangleStatus;
    }

    /**
     * Calculate the conflict reason for the message.
     * @param metadata The metadata to calculate the conflict reason from.
     * @returns The conflict reason.
     */
    private calculateConflictReason(metadata?: IMessageMetadata): string {
        let conflictReason: string = "";

        if (metadata?.ledgerInclusionState === "conflicting") {
            conflictReason = metadata.conflictReason && CONFLICT_REASON_STRINGS[metadata.conflictReason]
                ? CONFLICT_REASON_STRINGS[metadata.conflictReason]
                : "The reason for the conflict is unknown";
        }

        return conflictReason;
    }
}

export default Message;
