import { ISSUER_FEATURE_TYPE, METADATA_FEATURE_TYPE, SENDER_FEATURE_TYPE, TAG_FEATURE_TYPE } from "@iota/iota.js";
import classNames from "classnames";
import React, { Component, ReactNode } from "react";
import { NameHelper } from "../../../utils/nameHelper";
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
                                showHexAddress={false}
                                address={this.props.feature.address}
                            />
                        )}
                        {this.props.feature.type === METADATA_FEATURE_TYPE && (
                            <React.Fragment>
                                <div className="card--label">
                                    Data:
                                </div>
                                <div className="card--value row">
                                    {this.props.feature.data}
                                </div>
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
