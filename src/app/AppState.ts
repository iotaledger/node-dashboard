
export interface AppState {
    /**
     * Is the user logged in.
     */
    isLoggedIn: boolean;

    /**
     * What is the current theme.
     */
    theme: string;

    /**
     * Is the app online.
     */
    online: boolean;

    /**
     * The sync health.
     */
    syncHealth: boolean;

    /**
     * The node health.
     */
    nodeHealth: boolean;
}
