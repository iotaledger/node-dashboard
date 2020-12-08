import classNames from "classnames";
import React, { Component, ReactNode } from "react";
import "./ToggleButton.scss";
import { ReactComponent as ToggleIcon } from "../../../assets/toggle.svg";
import { ToggleButtonProps } from "./ToggleButtonProps";
import { ToggleButtonState } from "./ToggleButtonState";

/**
 * Component which will display a toggle button.
 */
class ToggleButton extends Component<ToggleButtonProps, ToggleButtonState> {
    /**
     * Create a new instance of ToggleButton.
     * @param props The props.
     */
    constructor(props: ToggleButtonProps) {
        super(props);

        this.state = {
            value: props.value
        };
    }

    /**
     * The component did update.
     * @param prevProps The previous properties.
     */
    public componentDidUpdate(prevProps: ToggleButtonProps): void {
        if (this.props.value !== prevProps.value) {
            this.setState({ value: this.props.value });
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <button
                type="button"
                className={
                    classNames(
                        "toggle-button",
                        { "toggle-button--checked": this.state.value }
                    )
                }
                onClick={e => this.setState({ value: !this.state.value },
                    () => {
                        this.props.onChanged(this.state.value);
                    })}
            >
                <div className="icon-container">
                    <ToggleIcon />
                </div>
            </button>
        );
    }
}

export default ToggleButton;
