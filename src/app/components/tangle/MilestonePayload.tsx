/* eslint-disable max-len */
import React, { Component, ReactNode } from "react";
import { FormatHelper } from "../../../utils/formatHelper";
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
                <div className="card--label">
                    Inclusion Merkle Proof
                </div>
                <div className="card--value card--value__mono">
                    {this.props.payload.inclusionMerkleProof}
                </div>
                {this.props.payload.publicKeys && (
                    <React.Fragment>
                        <div className="card--label">
                            Public Keys
                        </div>
                        <div className="card--value card--value__mono">
                            {this.props.payload.publicKeys?.map(pubKey => (
                                <div key={pubKey} className="margin-b-s">
                                    {pubKey}
                                </div>
                            ))}
                        </div>
                    </React.Fragment>
                )}
                <div className="card--label">
                    Signatures
                </div>
                <div className="card--value card--value__mono">
                    {this.props.payload.signatures.map(sig => (
                        <div key={sig} className="margin-b-s">
                            {sig}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}

export default MilestonePayload;
