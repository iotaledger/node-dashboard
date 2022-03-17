import { ISSUER_FEATURE_BLOCK_TYPE, METADATA_FEATURE_BLOCK_TYPE, SENDER_FEATURE_BLOCK_TYPE, serializeMessage, TAG_FEATURE_BLOCK_TYPE } from "@iota/iota.js";
import { Converter } from "@iota/util.js";
import React, { Component, ReactNode } from "react";
import { NameHelper } from "../../../utils/nameHelper";
import Address from "./Address";
import { FeatureBlockProps } from "./FeatureBlockProps";

/**
 * Component which will display an Feature Block.
 */
class FeatureBlock extends Component<FeatureBlockProps> {
    /**
     * Create a new instance of Feature Block.
     * @param props The props.
     */
    constructor(props: FeatureBlockProps) {
        super(props);
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="feature-block">
                <h3>{NameHelper.getFeatureBlockTypeName(this.props.featureBlock.type)}</h3>

                {this.props.featureBlock.type === SENDER_FEATURE_BLOCK_TYPE && (
                    <React.Fragment>
                        <div className="card--label">
                            Address
                        </div>
                        <Address
                            address={this.props.featureBlock.address}
                        />
                    </React.Fragment>
                )}
                {this.props.featureBlock.type === ISSUER_FEATURE_BLOCK_TYPE && (
                    <React.Fragment>
                        <div className="card--label">
                            Address
                        </div>
                        <Address
                            address={this.props.featureBlock.address}
                        />
                    </React.Fragment>
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
        );
    }
}

export default FeatureBlock;
