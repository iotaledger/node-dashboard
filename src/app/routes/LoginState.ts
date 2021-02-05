
export interface LoginState {
    /**
     * The user.
     */
    user: string;

    /**
     * The password.
     */
    password: string;

    /**
     * Is the component busy.
     */
    isBusy: boolean;

    /**
     * Any error from the login.
     */
    error: boolean;

    /**
     * Redirect after login.
     */
    redirect: string;
}
