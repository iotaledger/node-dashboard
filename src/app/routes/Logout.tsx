import React, { Component, ReactNode } from "react";
import { Redirect } from "react-router-dom";
import { ServiceFactory } from "../../factories/serviceFactory";
import { AuthService } from "../../services/authService";

/**
 * Logout panel.
 */
class Logout extends Component<unknown> {
    /**
     * The auth service.
     */
    private readonly _authService: AuthService;

    /**
     * Create a new instance of Logout.
     * @param props The props.
     */
    constructor(props: unknown) {
        super(props);

        this._authService = ServiceFactory.get<AuthService>("auth");

        this._authService.logout();
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return <Redirect to="/" />;
    }
}

export default Logout;
