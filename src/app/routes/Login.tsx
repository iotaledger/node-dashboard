import React, { ReactNode } from "react";
import { Redirect } from "react-router-dom";
import { ServiceFactory } from "../../factories/serviceFactory";
import { AuthService } from "../../services/authService";
import AsyncComponent from "../components/layout/AsyncComponent";
import Spinner from "../components/layout/Spinner";
import "./Login.scss";
import { LoginState } from "./LoginState";

/**
 * Login panel.
 */
class Login extends AsyncComponent<unknown, LoginState> {
    /**
     * The auth service.
     */
    private readonly _authService: AuthService;

    /**
     * Create a new instance of Login.
     * @param props The props.
     */
    constructor(props: unknown) {
        super(props);

        this._authService = ServiceFactory.get<AuthService>("auth");

        this.state = {
            user: "",
            password: "",
            isBusy: false,
            error: false,
            redirect: ""
        };
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        if (this.state.redirect.length > 0) {
            return <Redirect to={this.state.redirect} />;
        }
        return (
            <div className="login">
                <div className="content">
                    <h2>Login</h2>
                    <div className="card margin-t-s padding-l">
                        <form>
                            <p>Please enter your credentials to unlock the full dashboard.</p>
                            <div className="card--label">
                                User
                            </div>
                            <div className="card--value row">
                                <input
                                    type="text"
                                    autoComplete="username"
                                    value={this.state.user}
                                    disabled={this.state.isBusy}
                                    onChange={e => this.setState({ user: e.target.value })}
                                />
                            </div>
                            <div className="card--label">
                                Password
                            </div>
                            <div className="card--value row">
                                <input
                                    type="password"
                                    autoComplete="current-password"
                                    value={this.state.password}
                                    disabled={this.state.isBusy}
                                    onChange={e => this.setState({ password: e.target.value })}
                                />
                            </div>
                            <hr />
                            <div className="card--value row middle">
                                <button
                                    className="card--action margin-r-s"
                                    type="button"
                                    disabled={this.state.isBusy ||
                                        this.state.user.length === 0 ||
                                        this.state.password.length === 0}
                                    onClick={e => this.login()}
                                >
                                    Login
                                </button>
                                {this.state.isBusy && (
                                    <Spinner />
                                )}
                                {this.state.error && (
                                    <p className="danger margin-l-t">Your login attempt failed, please try again.</p>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Try the login.
     */
    private login(): void {
        this.setState({
            isBusy: true,
            error: false
        }, async () => {
            const success = await this._authService.login(this.state.user, this.state.password);

            this.setState({
                isBusy: false,
                error: !success,
                redirect: success ? "/" : ""
            });
        });
    }
}

export default Login;
