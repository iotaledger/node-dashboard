import classNames from "classnames";
import { BASIC_OUTPUT_TYPE, ALIAS_OUTPUT_TYPE, FOUNDRY_OUTPUT_TYPE, NFT_OUTPUT_TYPE, TREASURY_OUTPUT_TYPE, UnitsHelper, IOutputResponse, SIMPLE_TOKEN_SCHEME_TYPE } from "@iota/iota.js";
import React, { Component, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ClipboardHelper } from "../../../utils/clipboardHelper";
import { NameHelper } from "../../../utils/nameHelper";
import MessageButton from "../layout/MessageButton";
import FeatureBlock from "./FeatureBlock";
import { OutputProps } from "./OutputProps";
import { OutputState } from "./OutputState";
import UnlockCondition from "./UnlockCondition";
import { ReactComponent as DropdownIcon } from "./../../../assets/dropdown-arrow.svg";
import "./Output.scss";

/**
 * Component which will display an output.
 */
class Output extends Component<OutputProps, OutputState> {
    /**
     * Create a new instance of Output.
     * @param props The props.
     */
    constructor(props: OutputProps) {
        super(props);

        this.state = {
            formatFull: false,
            isGenesis: (this.isOutputResponse(props.output)) ? props.output.messageId === "0".repeat(64) : false,
            output: (this.isOutputResponse(props.output)) ? props.output.output : props.output,
            showDetails: false
        };
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="output margin-t-m">
                <div className="card--content padding-0">
                    <div
                        className="card--content__input"
                        onClick={() => this.setState({ showDetails: !this.state.showDetails })} >

                        <div className={classNames("margin-r-t", "card--content__input--dropdown", { opened: this.state.showDetails })}>
                            <DropdownIcon />
                        </div>
                        <h2>{NameHelper.getOutputTypeName(this.state.output.type)} {this.props.index}</h2>

                        <div className="output__amount card--value card--value__mono">
                            <button
                                className="card--value--button"
                                type="button"
                                onClick={() => this.setState(
                                    {
                                        formatFull: !this.state.formatFull
                                    }
                                )}
                            >
                                {this.state.formatFull
                                    ? `${this.state.output.amount} i`
                                    : UnitsHelper.formatBest(Number(this.state.output.amount))}
                            </button>
                        </div>
                    </div>

                    {this.state.showDetails && (
                        <div className="output__details">
                            {/* Diplay metadata for Output Response */}
                            {this.isOutputResponse(this.props.output) && (
                                <React.Fragment>
                                    <div className="card--label">
                                        Message Id
                                    </div>
                                    <div className="card--value row">
                                        {this.state.isGenesis && (
                                            <span>Genesis</span>
                                        )}
                                        {!this.state.isGenesis && (
                                            <React.Fragment>
                                                <Link
                                                    to={
                                                        `/explorer/message/${this.props.output.messageId}`
                                                    }
                                                    className="margin-r-t"
                                                >
                                                    {this.props.output.messageId}
                                                </Link>
                                                <MessageButton
                                                    onClick={() => {
                                                        if (this.isOutputResponse(this.props.output)) {
                                                            ClipboardHelper.copy(this.props.output.messageId);
                                                        }
                                                    }}
                                                    buttonType="copy"
                                                    labelPosition="top"
                                                />
                                            </React.Fragment>
                                        )}
                                    </div>
                                    <div className="card--label">
                                        Transaction Id
                                    </div>
                                    <div className="card--value row">
                                        {this.state.isGenesis && (
                                            <span>Genesis</span>
                                        )}
                                        {!this.state.isGenesis && (
                                            <React.Fragment>
                                                <span className="margin-r-t">
                                                    {this.props.output.transactionId}
                                                </span>
                                                <MessageButton
                                                    onClick={() => {
                                                        if (this.isOutputResponse(this.props.output)) {
                                                            ClipboardHelper.copy(this.props.output.transactionId);
                                                        }
                                                    }}
                                                    buttonType="copy"
                                                    labelPosition="top"
                                                />
                                            </React.Fragment>
                                        )}
                                    </div>
                                    <div className="card--label">
                                        Index
                                    </div>
                                    <div className="card--value">
                                        {this.props.output.outputIndex}
                                    </div>
                                    <div className="card--label">
                                        Is Spent
                                    </div>
                                    <div className="card--value">
                                        {this.props.output.isSpent ? "Yes" : "No"}
                                    </div>
                                </React.Fragment>
                            )}

                            {this.state.output.type === ALIAS_OUTPUT_TYPE && (
                                <React.Fragment>
                                    <div className="card--label">
                                        Alias id:
                                    </div>
                                    <div className="card--value row">
                                        {this.state.output.aliasId}
                                    </div>
                                    <div className="card--label">
                                        State index:
                                    </div>
                                    <div className="card--value row">
                                        {this.state.output.stateIndex}
                                    </div>
                                    <div className="card--label">
                                        State metadata:
                                    </div>
                                    <div className="card--value row">
                                        {this.state.output.stateMetadata}
                                    </div>
                                    <div className="card--label">
                                        Foundry counter:
                                    </div>
                                    <div className="card--value row">
                                        {this.state.output.foundryCounter}
                                    </div>
                                </React.Fragment>
                            )}

                            {this.state.output.type === NFT_OUTPUT_TYPE && (
                                <React.Fragment>
                                    <div className="card--label">
                                        Nft id:
                                    </div>
                                    <div className="card--value row">
                                        {this.state.output.nftId}
                                    </div>
                                </React.Fragment>
                            )}

                            {this.state.output.type === FOUNDRY_OUTPUT_TYPE && (
                                <React.Fragment>
                                    <div className="card--label">
                                        Serial number:
                                    </div>
                                    <div className="card--value row">
                                        {this.state.output.serialNumber}
                                    </div>
                                    <div className="card--label">
                                        Token tag:
                                    </div>
                                    <div className="card--value row">
                                        {this.state.output.tokenTag}
                                    </div>
                                    <div className="card--label">
                                        Token scheme type:
                                    </div>
                                    <div className="card--value row">
                                        {this.state.output.tokenScheme.type}
                                    </div>
                                    {this.state.output.tokenScheme.type === SIMPLE_TOKEN_SCHEME_TYPE && (
                                        <React.Fragment>
                                            <div className="card--label">
                                                Minted tokens:
                                            </div>
                                            <div className="card--value row">
                                                {this.state.output.tokenScheme.mintedTokens}
                                            </div>
                                            <div className="card--label">
                                                Melted tokens:
                                            </div>
                                            <div className="card--value row">
                                                {this.state.output.tokenScheme.meltedTokens}
                                            </div>
                                            <div className="card--label">
                                                Maximum supply:
                                            </div>
                                            <div className="card--value row">
                                                {this.state.output.tokenScheme.maximumSupply}
                                            </div>
                                        </React.Fragment>
                                    )}
                                </React.Fragment>
                            )}

                            {/* all output types except Treasury have common output conditions */}
                            {this.state.output.type !== TREASURY_OUTPUT_TYPE && (
                                <React.Fragment>
                                    {this.state.output.unlockConditions.map((unlockCondition, idx) => (
                                        <UnlockCondition
                                            key={idx}
                                            unlockCondition={unlockCondition}
                                        />
                                    ))}
                                    {this.state.output.featureBlocks.map((featureBlock, idx) => (
                                        <FeatureBlock
                                            key={idx}
                                            featureBlock={featureBlock}
                                        />
                                    ))}
                                    {this.state.output.type !== BASIC_OUTPUT_TYPE && this.state.output.immutableFeatureBlocks && (
                                        <React.Fragment>
                                            {this.state.output.immutableFeatureBlocks.map((immutableFeatureBlock, idx) => (
                                                <FeatureBlock
                                                    key={idx}
                                                    featureBlock={immutableFeatureBlock}
                                                />
                                            ))}
                                        </React.Fragment>
                                    )}
                                    {this.state.output.nativeTokens.map((token, idx) => (
                                        <React.Fragment key={idx}>
                                            <div className="native-token padding-t-s">
                                                <h3>Native token</h3>
                                                <div className="card--label">
                                                    Token id:
                                                </div>
                                                <div className="card--value row">
                                                    {token.id}
                                                </div>
                                                <div className="card--label">
                                                    Amount:
                                                </div>
                                                <div className="card--value row">
                                                    {token.amount}
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    ))}
                                </React.Fragment>
                            )}

                        </div>
                    )}
                    
                </div>
            </div>
        );
    }

    /**
     * Check if object is type of IOutputResponse.
     * @param object The object to check.
     * @returns True of object is IOutputResponse.
     */
    private isOutputResponse(object: unknown): object is IOutputResponse {
        return Object.prototype.hasOwnProperty.call(object, "messageId");
    }
}

export default Output;
