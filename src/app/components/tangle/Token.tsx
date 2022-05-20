import classNames from "classnames";
import React, { Component, ReactNode } from "react";
import { ReactComponent as DropdownIcon } from "./../../../assets/dropdown-arrow.svg";
import { TokenProps } from "./TokenProps";
import { TokenState } from "./TokenState";


/**
 * Component which will display an Token.
 */
class Token extends Component<TokenProps, TokenState> {
    /**
     * Create a new instance of Token.
     * @param props The props.
     */
     constructor(props: TokenProps) {
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
            <div className="native-token padding-t-s">
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
                        Token {this.props.index}
                    </h3>
                </div>
                {this.state.showDetails && (
                    <div className="card--content--border-l">
                        <div className="card--label">
                            Token Id
                        </div>
                        <div className="card--value card--value__mono">
                            {this.props.token.id}
                        </div>
                        <div className="card--label">
                            Amount
                        </div>
                        <div className="card--value card--value__mono">
                            {this.props.token.amount}
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default Token;
