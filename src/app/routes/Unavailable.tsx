import React, { ReactNode } from "react";
import { Link, RouteComponentProps } from "react-router-dom";
import { ReactComponent as ChevronLeftIcon } from "../../assets/chevron-left.svg";
import AsyncComponent from "../components/layout/AsyncComponent";
import "./Unavailable.scss";

/**
 * Component which will show the unavailable page.
 */
class Unavailable extends AsyncComponent<RouteComponentProps<never>> {
    /**
     * Create a new instance of Unavailable.
     * @param props The props.
     */
    constructor(props: RouteComponentProps<never>) {
        super(props);

        this.state = {};
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="unavailable">
                <div className="content">
                    <Link
                        to="/explorer"
                        className="row middle inline"
                    >
                        <ChevronLeftIcon className="secondary" />
                        <h3 className="secondary margin-l-s">Back to Explorer</h3>
                    </Link>

                    <div className="card margin-t-m padding-l">
                        <h2 className="margin-b-m">Service Unavailable</h2>
                        <p>The node is currently unavailable or is not synced, please try again later.</p>
                    </div>
                </div>
            </div>
        );
    }
}

export default Unavailable;
