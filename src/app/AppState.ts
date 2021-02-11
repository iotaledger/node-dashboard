
export interface AppState {
    /**
     * Is the user logged in.
     */
    isLoggedIn: boolean;

    /**
     * The node alias.
     */
    alias?: string;

    /**
     * The lastest milestone index.
     */
    lmi?: string;

    /**
     * The lastest solid milestone index.
     */
    lsmi?: string;
}
