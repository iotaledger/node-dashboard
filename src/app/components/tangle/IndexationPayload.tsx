import { Converter } from "@iota/iota.js";
import React, { Component, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ClipboardHelper } from "../../../utils/clipboardHelper";
import { TextHelper } from "../../../utils/textHelper";
import MessageButton from "../../components/layout/MessageButton";
import { IndexationPayloadProps } from "./IndexationPayloadProps";
import { IndexationPayloadState } from "./IndexationPayloadState";

/**
 * Component which will display a indexation payload.
 */
class IndexationPayload extends Component<IndexationPayloadProps, IndexationPayloadState> {
    /**
     * Create a new instance of IndexationPayload.
     * @param props The props.
     */
    constructor(props: IndexationPayloadProps) {
        super(props);

        if (props.payload.data) {
            const match = props.payload.data.match(/.{1,2}/g);

            const ascii = Converter.hexToAscii(props.payload.data);

            let json;

            try {
                const nonAscii = TextHelper.decodeNonASCII(ascii);
                if (nonAscii) {
                    json = JSON.stringify(JSON.parse(nonAscii), undefined, "\t");
                }
            } catch { }

            this.state = {
                hex: match ? match.join(" ") : props.payload.data,
                ascii,
                json
            };
        } else {
            this.state = {};
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="indexation-payload">
                <h2>Indexation Payload</h2>
                <div className="card--label">
                    Index
                </div>
                <div className="card--value row">
                    <Link
                        className="margin-r-t"
                        to={
                            `/explorer/indexed/${this.props.payload.index}`
                        }
                    >
                        {this.props.payload.index}
                    </Link>
                    <MessageButton
                        onClick={() => ClipboardHelper.copy(
                            this.props.payload.index
                        )}
                        buttonType="copy"
                        labelPosition="top"
                    />
                </div>
                {!this.state.json && this.state.ascii && (
                    <React.Fragment>
                        <div className="card--label row bottom spread">
                            Data ASCII
                            <MessageButton
                                onClick={() => ClipboardHelper.copy(
                                    this.state.ascii
                                )}
                                buttonType="copy"
                                labelPosition="top"
                            />
                        </div>
                        <div className="card--value card--value-textarea card--value-textarea__ascii">
                            {this.state.ascii}
                        </div>
                    </React.Fragment>
                )}
                {this.state.json && (
                    <React.Fragment>
                        <div className="card--label row bottom spread">
                            Data JSON
                            <MessageButton
                                onClick={() => ClipboardHelper.copy(
                                    this.state.json
                                )}
                                buttonType="copy"
                                labelPosition="top"
                            />
                        </div>
                        <div className="card--value card--value-textarea card--value-textarea__json">
                            {this.state.json}
                        </div>
                    </React.Fragment>
                )}
                {this.state.hex && (
                    <React.Fragment>
                        <div className="card--label row middle">
                            <span className="margin-r-t">Data Hex</span>
                            <MessageButton
                                onClick={() => ClipboardHelper.copy(
                                    this.state.hex
                                )}
                                buttonType="copy"
                                labelPosition="right"
                            />
                        </div>
                        <div className="card--value card--value-textarea card--value-textarea__hex">
                            {this.state.hex}
                        </div>
                    </React.Fragment>
                )}
            </div>
        );
    }
}

export default IndexationPayload;
