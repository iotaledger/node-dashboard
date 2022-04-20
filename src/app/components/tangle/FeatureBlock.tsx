import { ISSUER_FEATURE_BLOCK_TYPE, METADATA_FEATURE_BLOCK_TYPE, SENDER_FEATURE_BLOCK_TYPE, TAG_FEATURE_BLOCK_TYPE } from "@iota/iota.js";
import classNames from "classnames";
import React, { Component, ReactNode } from "react";
import { NameHelper } from "../../../utils/nameHelper";
import { ReactComponent as DropdownIcon } from "./../../../assets/dropdown-arrow.svg";
import Address from "./Address";
import { FeatureBlockProps } from "./FeatureBlockProps";
import { FeatureBlockState } from "./FeatureBlockState";

/**
 * Component which will display an Feature Block.
 */
class FeatureBlock extends Component<FeatureBlockProps, FeatureBlockState> {
    /**
     * Create a new instance of Output.
     * @param props The props.
     */
     constructor(props: FeatureBlockProps) {
        super(props);

        this.state = {
            showDetails: false
        };
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="feature-block padding-t-s">
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
                    <h3>{NameHelper.getFeatureBlockTypeName(this.props.featureBlock.type)}</h3>
                </div>

                {this.state.showDetails && (
                    <div className="card--content--border-l">
                        {(this.props.featureBlock.type === SENDER_FEATURE_BLOCK_TYPE ||
                        this.props.featureBlock.type === ISSUER_FEATURE_BLOCK_TYPE) && (
                            <Address
                                address={this.props.featureBlock.address}
                            />
                        )}
                        {this.props.featureBlock.type === METADATA_FEATURE_BLOCK_TYPE && (
                            <React.Fragment>
                                <div className="card--label">
                                    Data:
                                </div>
                                <div className="card--value row">
                                    {this.props.featureBlock.data}
                                </div>
                            </React.Fragment>
                        )}
                        {this.props.featureBlock.type === TAG_FEATURE_BLOCK_TYPE && (
                            <React.Fragment>
                                <div className="card--label">
                                    Tag:
                                </div>
                                <div className="card--value row">
                                    {this.props.featureBlock.tag}
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
