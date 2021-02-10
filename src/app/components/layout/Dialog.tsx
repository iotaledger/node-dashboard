import React, { Component, ReactNode } from "react";
import "./Dialog.scss";
import { DialogProps } from "./DialogProps";

/**
 * Component which will display a dialog.
 */
class Dialog extends Component<DialogProps> {
    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <React.Fragment>
                <div className="dialog-click-shield" />
                <div className="dialog-container">
                    <div className="dialog">
                        <div className="dialog-header">
                            <h1>{this.props.title}</h1>
                        </div>
                        <div className="dialog-content">
                            {this.props.children}
                        </div>
                        <div className="dialog-footer">
                            {this.props.actions}
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

export default Dialog;
