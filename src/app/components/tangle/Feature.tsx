import { ISSUER_FEATURE_TYPE, METADATA_FEATURE_TYPE, SENDER_FEATURE_TYPE, TAG_FEATURE_TYPE } from "@iota/iota.js";
import { Converter } from "@iota/util.js";
import classNames from "classnames";
import React, { Component, ReactNode } from "react";
import { ClipboardHelper } from "../../../utils/clipboardHelper";
import { NameHelper } from "../../../utils/nameHelper";
import BlockButton from "../layout/BlockButton";
import { ReactComponent as DropdownIcon } from "./../../../assets/dropdown-arrow.svg";
import Bech32Address from "./Bech32Address";
import { FeatureProps } from "./FeatureProps";
import { FeatureState } from "./FeatureState";

/**
 * Component which will display an Feature.
 */
class FeatureBlock extends Component<FeatureProps, FeatureState> {
    /**
     * Create a new instance of Feature.
     * @param props The props.
     */
     constructor(props: FeatureProps) {
        super(props);

        let hexData;
        let utf8Data;
        let jsonData;

        if (this.props.feature.type === METADATA_FEATURE_TYPE) {
            const matchHexData = this.props.feature.data.match(/.{1,2}/g);

            hexData = matchHexData ? matchHexData.join(" ") : this.props.feature.data;
            utf8Data = Converter.hexToUtf8(this.props.feature.data);

            try {
                jsonData = JSON.stringify(JSON.parse(utf8Data), undefined, "  ");
            } catch {}
        }


        this.state = {
            showDetails: false,
            utf8Data,
            hexData,
            jsonData
        };
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="feature padding-t-s">
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
                        {NameHelper.getFeatureBlockTypeName(this.props.feature.type)}
                    </h3>
                </div>

                {this.state.showDetails && (
                    <div className="card--content--border-l">
                        {(this.props.feature.type === SENDER_FEATURE_TYPE ||
                        this.props.feature.type === ISSUER_FEATURE_TYPE) && (
                            <Bech32Address
                                activeLinks={false}
                                showHexAddress={true}
                                address={this.props.feature.address}
                            />
                        )}
                        {this.props.feature.type === METADATA_FEATURE_TYPE && (
                            <React.Fragment>
                                {!this.state.jsonData && this.state.utf8Data && (
                                    <React.Fragment>
                                        <div className="card--label row bottom spread">
                                            <span className="margin-r-t">Data UTF8</span>
                                            <BlockButton
                                                onClick={() => ClipboardHelper.copy(
                                                    this.state.utf8Data
                                                )}
                                                buttonType="copy"
                                                labelPosition="top"
                                            />
                                        </div>
                                        <div className="card--value card--value-textarea card--value-textarea__utf8">
                                            {this.state.utf8Data}
                                        </div>
                                    </React.Fragment>
                                )}
                                {this.state.jsonData && (
                                    <React.Fragment>
                                        <div className="card--label row bottom spread">
                                            Data JSON
                                            <BlockButton
                                                onClick={() => ClipboardHelper.copy(
                                                    this.state.jsonData
                                                )}
                                                buttonType="copy"
                                                labelPosition="top"
                                            />
                                        </div>
                                        <div className="card--value card--value-textarea card--value-textarea__json">
                                            {this.state.jsonData}
                                        </div>
                                    </React.Fragment>
                                )}
                                {this.state.hexData && (
                                    <React.Fragment>
                                        <div className="card--label row middle">
                                            <span className="margin-r-t">Data Hex</span>
                                            <BlockButton
                                                onClick={() => ClipboardHelper.copy(
                                                    this.state.hexData?.replace(/ /g, "")
                                                )}
                                                buttonType="copy"
                                                labelPosition="right"
                                            />
                                        </div>
                                        <div className="card--value card--value-textarea card--value-textarea__hex">
                                            {this.state.hexData}
                                        </div>
                                    </React.Fragment>
                                )}
                            </React.Fragment>
                        )}
                        {this.props.feature.type === TAG_FEATURE_TYPE && (
                            <React.Fragment>
                                <div className="card--label">
                                    Tag:
                                </div>
                                <div className="card--value row">
                                    {this.props.feature.tag}
                                </div>
                            </React.Fragment>
                        )}
                    </div>
                )}

            </div>
        );
    }
}

export default FeatureBlock;
