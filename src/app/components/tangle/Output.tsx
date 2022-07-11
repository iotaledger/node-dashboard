import { Blake2b } from "@iota/crypto.js";
import { BASIC_OUTPUT_TYPE, ALIAS_OUTPUT_TYPE, FOUNDRY_OUTPUT_TYPE, NFT_OUTPUT_TYPE, TREASURY_OUTPUT_TYPE, SIMPLE_TOKEN_SCHEME_TYPE, ALIAS_ADDRESS_TYPE, NFT_ADDRESS_TYPE, IImmutableAliasUnlockCondition, IAliasAddress, TransactionHelper, serializeOutput } from "@iota/iota.js";
import { WriteStream, Converter } from "@iota/util.js";
import classNames from "classnames";
import React, { Component, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ClipboardHelper } from "../../../utils/clipboardHelper";
import { FormatHelper } from "../../../utils/formatHelper";
import { NameHelper } from "../../../utils/nameHelper";
import BlockButton from "../layout/BlockButton";
import { ReactComponent as DropdownIcon } from "./../../../assets/dropdown-arrow.svg";
import Bech32Address from "./Bech32Address";
import Feature from "./Feature";
import { OutputProps } from "./OutputProps";
import { OutputState } from "./OutputState";
import Token from "./Token";
import UnlockCondition from "./UnlockCondition";

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
            isGenesis: props.metadata?.blockId === "0".repeat(64) ?? false,
            showDetails: this.props.showDetails ?? false,
            showTokens: false
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
                    <div className="card--header row spread">
                        <div
                            className="card--content__input"
                            onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                        >
                            <div className={classNames(
                                    "margin-r-t",
                                    "card--content__input--dropdown",
                                    { "opened": this.state.showDetails }
                                )}
                            >
                                <DropdownIcon />
                            </div>
                            <h3 className="card--content__input--label">
                                {NameHelper.getOutputTypeName(this.props.output.type)} {this.props.index}
                            </h3>
                        </div>
                        <div className="card--value card--value__mono">
                            <button
                                className="card--value--button"
                                type="button"
                                onClick={() => this.setState(
                                    {
                                        formatFull: !this.state.formatFull
                                    }
                                )}
                            >
                                {FormatHelper.getInstance().amount(
                                    Number(this.props.output.amount),
                                    this.state.formatFull
                                )}
                            </button>
                        </div>
                    </div>

                    {this.state.showDetails && (
                        <div className="card--content--border-l">
                            {/* Diplay metadata for Output Response */}
                            {this.props.metadata && (
                                <React.Fragment>
                                    <div className="card--label">
                                        Block Id
                                    </div>
                                    <div className="card--value row">
                                        {this.state.isGenesis && (
                                            <span>Genesis</span>
                                        )}
                                        {!this.state.isGenesis && (
                                            <React.Fragment>
                                                <Link
                                                    to={
                                                        `/explorer/block/${this.props.metadata.blockId}`
                                                    }
                                                    className="margin-r-t"
                                                >
                                                    {this.props.metadata.blockId}
                                                </Link>
                                                <BlockButton
                                                    onClick={() => {
                                                        ClipboardHelper.copy(this.props.metadata?.blockId);
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
                                                    {this.props.metadata.transactionId}
                                                </span>
                                                <BlockButton
                                                    onClick={() => {
                                                        ClipboardHelper.copy(this.props.metadata?.transactionId);
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
                                        {this.props.metadata.outputIndex}
                                    </div>
                                    <div className="card--label">
                                        Is Spent
                                    </div>
                                    <div className="card--value">
                                        {this.props.metadata.isSpent ? "Yes" : "No"}
                                    </div>
                                </React.Fragment>
                            )}

                            {this.props.output.type === ALIAS_OUTPUT_TYPE && (
                                <React.Fragment>
                                    <Bech32Address
                                        activeLinks={true}
                                        showHexAddress={false}
                                        address={
                                            {
                                                aliasId: FormatHelper
                                                        .resolveId(this.props.output.aliasId, this.getOutputId()),
                                                type: ALIAS_ADDRESS_TYPE
                                            }
                                        }
                                    />
                                    <div className="card--label">
                                        State index:
                                    </div>
                                    <div className="card--value row">
                                        {this.props.output.stateIndex}
                                    </div>
                                    <div className="card--label">
                                        State metadata:
                                    </div>
                                    <div className="card--value row">
                                        {this.props.output.stateMetadata}
                                    </div>
                                    <div className="card--label">
                                        Foundry counter:
                                    </div>
                                    <div className="card--value row">
                                        {this.props.output.foundryCounter}
                                    </div>
                                </React.Fragment>
                            )}

                            {this.props.output.type === NFT_OUTPUT_TYPE && (
                                <Bech32Address
                                    activeLinks={true}
                                    showHexAddress={false}
                                    address={
                                            {
                                                nftId: FormatHelper
                                                        .resolveId(this.props.output.nftId, this.getOutputId()),
                                                type: NFT_ADDRESS_TYPE
                                            }
                                        }
                                />
                            )}

                            {this.props.output.type === FOUNDRY_OUTPUT_TYPE && (
                                <React.Fragment>
                                    <div className="card--label">
                                        Foundry id:
                                    </div>
                                    <div className="card--value row">
                                        {TransactionHelper.constructTokenId(
                                            ((this.props.output.unlockConditions[0] as IImmutableAliasUnlockCondition)
                                                .address as IAliasAddress).aliasId,
                                            this.props.output.serialNumber,
                                            this.props.output.tokenScheme.type)}
                                    </div>
                                    <div className="card--label">
                                        Serial number:
                                    </div>
                                    <div className="card--value row">
                                        {this.props.output.serialNumber}
                                    </div>
                                    <div className="card--label">
                                        Token scheme type:
                                    </div>
                                    <div className="card--value row">
                                        {this.props.output.tokenScheme.type}
                                    </div>
                                    {this.props.output.tokenScheme.type === SIMPLE_TOKEN_SCHEME_TYPE && (
                                        <React.Fragment>
                                            <div className="card--label">
                                                Minted tokens:
                                            </div>
                                            <div className="card--value row">
                                                {Number.parseInt(this.props.output.tokenScheme.mintedTokens, 16)}
                                            </div>
                                            <div className="card--label">
                                                Melted tokens:
                                            </div>
                                            <div className="card--value row">
                                                {Number.parseInt(this.props.output.tokenScheme.meltedTokens, 16)}
                                            </div>
                                            <div className="card--label">
                                                Maximum supply:
                                            </div>
                                            <div className="card--value row">
                                                {Number.parseInt(this.props.output.tokenScheme.maximumSupply, 16)}
                                            </div>
                                        </React.Fragment>
                                    )}
                                </React.Fragment>
                            )}

                            {/* all output types except Treasury have common output conditions */}
                            {this.props.output.type !== TREASURY_OUTPUT_TYPE && (
                                <React.Fragment>
                                    {this.props.output.unlockConditions.map((unlockCondition, idx) => (
                                        <UnlockCondition
                                            key={idx}
                                            unlockCondition={unlockCondition}
                                        />
                                    ))}
                                    {this.props.output.features?.map((feature, idx) => (
                                        <Feature
                                            key={idx}
                                            feature={feature}
                                        />
                                    ))}
                                    {this.props.output.type !== BASIC_OUTPUT_TYPE &&
                                    this.props.output.immutableFeatures && (
                                        <React.Fragment>
                                            {this.props.output.immutableFeatures
                                                .map((immutableFeature, idx) => (
                                                    <Feature
                                                        key={idx}
                                                        feature={immutableFeature}
                                                    />
                                            ))}
                                        </React.Fragment>
                                    )}

                                    {this.props.output?.nativeTokens && (
                                        <React.Fragment>
                                            <div
                                                className="card--content__input margin-t-s"
                                                onClick={() => this.setState({ showTokens: !this.state.showTokens })}
                                            >
                                                <div className={classNames(
                                                        "margin-r-t",
                                                        "card--content__input--dropdown",
                                                        { "opened": this.state.showTokens }
                                                    )}
                                                >
                                                    <DropdownIcon />
                                                </div>
                                                <h3 className="card--content__input--label">
                                                    Native Tokens
                                                </h3>
                                            </div>
                                            {this.state.showTokens && (
                                                <div className="card--content--border-l">
                                                    {this.props.output.nativeTokens?.map((token, idx: number) => (
                                                        <Token
                                                            key={idx}
                                                            index={idx + 1}
                                                            token={{
                                                                id: token.id,
                                                                amount: token.amount
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </React.Fragment>
                                    )}
                                </React.Fragment>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    /**
     * Get output id from output.
     * @returns The output id.
     */
    private getOutputId(): string {
        const writeStream = new WriteStream();

        try {
            serializeOutput(writeStream, this.props.output);
        } catch (error) {
            if (error instanceof Error) {
                console.log(error.message);
            }
        }
        return Converter.bytesToHex(Blake2b.sum256(writeStream.finalBytes()), true);
    }
}

export default Output;
