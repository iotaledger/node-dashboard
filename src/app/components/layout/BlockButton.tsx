import classNames from "classnames";
import React, { Component, ReactNode } from "react";
import { ReactComponent as CopyIcon } from "../../../assets/copy.svg";
import "./BlockButton.scss";
import { BlockButtonProps } from "./BlockButtonProps";
import { BlockButtonState } from "./BlockButtonState";

/**
 * Component which will display a block button.
 */
class BlockButton extends Component<BlockButtonProps, BlockButtonState> {
    /**
     * Create a new instance of BlockButton.
     * @param props The props.
     */
    constructor(props: BlockButtonProps) {
        super(props);

        this.state = {
            active: false,
            message: props.buttonType === "copy" ? "Copied" : ""
        };
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="block-button">
                <button
                    type="button"
                    className={classNames(
                        "block-button-btn",
                        { "block-button-btn--active": this.state.active }
                    )}
                    onClick={() => this.activate()}
                >
                    {this.props.buttonType === "copy" && (
                        <CopyIcon />
                    )}
                </button>
                {this.state.active && this.state.message && (
                    <span
                        className={classNames(
                            "block-button--message",
                            { "block-button--message--right": this.props.labelPosition === "right" },
                            { "block-button--message--top": this.props.labelPosition === "top" }
                        )}
                    >
                        {this.state.message}
                    </span>
                )}
            </div>
        );
    }

    /**
     * Activate the button.
     */
    private activate(): void {
        this.props.onClick();

        this.setState({ active: true });
        setTimeout(
            () => {
                this.setState({ active: false });
            },
            2000);
    }
}

export default BlockButton;
