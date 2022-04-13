/* eslint-disable max-len */
import React, { Component, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ClipboardHelper } from "../../../utils/clipboardHelper";
import { FormatHelper } from "../../../utils/formatHelper";
import MessageButton from "../layout/MessageButton";
import { MilestonePayloadProps } from "./MilestonePayloadProps";

/**
 * Component which will display a milestone payload.
 */
class MilestonePayload extends Component<MilestonePayloadProps> {
    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="milestone-payload">
                <h2>Milestone Payload</h2>
                <div className="card--label">
                    Index
                </div>
                <div className="card--value">
                    {this.props.payload.index}
                </div>
                <div className="card--label">
                    Date
                </div>
                <div className="card--value">
                    {this.props.payload.timestamp && FormatHelper.date(
                        this.props.payload.timestamp
                    )}
                </div>
                {this.props.payload.parentMessageIds?.map((parent, idx) => (
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
                    Inclusion Merkle Proof
                </div>
                <div className="card--value card--value__mono">
                    {this.props.payload.inclusionMerkleProof}
                </div>
                {this.props.payload.nextPoWScore !== 0 && this.props.payload.nextPoWScoreMilestoneIndex !== 0 && (
                    <React.Fragment>
                        <div className="card--label">
                            Next PoW Score
                        </div>
                        <div className="card--value">
                            {this.props.payload.nextPoWScore}
                        </div>
                        <div className="card--label">
                            Next PoW Score Milestone Index
                        </div>
                        <div className="card--value">
                            {this.props.payload.nextPoWScoreMilestoneIndex}
                        </div>
                    </React.Fragment>
                )}
                {this.props.payload.metadata && (
                    <React.Fragment>
                        <div className="card--label">
                            Metadata
                        </div>
                        <div className="card--value card--value__mono">
                            {this.props.payload.metadata}
                        </div>
                    </React.Fragment>
                )}
                <div className="card--label">
                    Signatures
                </div>
                <div className="card--value card--value__mono">
                    {this.props.payload.signatures.map((sig, i) => (
                        <div key={i} className="margin-b-s">
                            <div className="card--label">
                                Public Key
                            </div>
                            <div className="card--value card--value__mono">
                                {sig.publicKey}
                            </div>
                            <div className="card--label">
                                Signature
                            </div>
                            <div className="card--value card--value__mono">
                                {sig.signature}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}

export default MilestonePayload;
