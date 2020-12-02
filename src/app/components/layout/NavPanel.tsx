import classNames from "classnames";
import React, { Component, ReactNode } from "react";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";
import { BrandHelper } from "../../../utils/brandHelper";
import "./NavPanel.scss";
import { NavPanelProps } from "./NavPanelProps";

/**
 * Navigation panel.
 */
class NavPanel extends Component<RouteComponentProps & NavPanelProps> {
    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="nav-panel">
                <img src={BrandHelper.getLogoNavigation()} className="logo" />

                {this.props.buttons.map(b => (
                    <Link
                        key={b.label}
                        to={b.route}
                        className={classNames(
                            "nav-panel--button",
                            {
                                "nav-panel--button__selected":
                                    (b.route.length > 1 && this.props.location.pathname.startsWith(b.route)) ||
                                    b.route === this.props.location.pathname
                            }
                        )}
                    >
                        {b.icon}
                        <span className="margin-t-t">{b.label}</span>
                    </Link>
                ))}
            </div>
        );
    }
}

export default withRouter(NavPanel);
