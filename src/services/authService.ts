import { ServiceFactory } from "../factories/serviceFactory";
import { FetchHelper } from "../utils/fetchHelper";
import { EventAggregator } from "./eventAggregator";
import { LocalStorageService } from "./localStorageService";

/**
 * Service to handle authentication.
 */
export class AuthService {
    /**
     * The jwt if authenticated.
     */
    private _jwt?: string;

    /**
     * The csrf cookie from the login operation.
     */
    private _csrf?: string;

    /**
     * Create a new instance of AuthService.
     */
    constructor() {
        this._jwt = undefined;

        if (document.cookie) {
            const cookies = document.cookie.split(";");

            const csrf = cookies.find(c => c.trim().startsWith("_csrf"));

            if (csrf) {
                const parts = csrf.split("=");
                if (parts.length === 2) {
                    this._csrf = parts[1];
                }
            }
        }
    }

    /**
     * Initialise service.
     */
    public async initialize(): Promise<void> {
        const storageService = ServiceFactory.get<LocalStorageService>("storage");

        const jwt = storageService.load<string>("dashboard-jwt");

        if (jwt) {
            await this.login(undefined, undefined, jwt);
        }
    }

    /**
     * Try performing a login.
     * @param user The username to login with.
     * @param password The password to login with.
     * @param jwt The jwt to login with.
     * @returns True if the login was successful.
     */
    public async login(
        user: string | undefined,
        password: string | undefined,
        jwt?: string): Promise<boolean> {
        this.logout();

        try {
            const headers: Record<string, string> = {};
            if (this._csrf) {
                headers["X-CSRF-Token"] = this._csrf;
            }

            const response = await FetchHelper.json<{
                user?: string;
                password?: string;
                jwt?: string;
            }, {
                jwt?: string;
            }>(
                `${window.location.protocol}//${window.location.host}`,
                "/login",
                "post",
                {
                    user,
                    password,
                    jwt
                },
                headers);

            if (response.jwt) {
                const storageService = ServiceFactory.get<LocalStorageService>("storage");
                this._jwt = response.jwt;
                storageService.save<string>("dashboard-jwt", this._jwt);
                EventAggregator.publish("auth-state", true);
            }
        } catch (err) {
            console.error(err);
        }

        return this._jwt !== undefined;
    }

    /**
     * Logout.
     */
    public logout(): void {
        if (this._jwt) {
            const storageService = ServiceFactory.get<LocalStorageService>("storage");
            storageService.remove("dashboard-jwt");
            this._jwt = undefined;
            this._csrf = undefined;
            EventAggregator.publish("auth-state", false);
        }
    }

    /**
     * Get the jwt.
     * @returns The jwt if logged in.
     */
    public isLoggedIn(): string | undefined {
        return this._jwt;
    }

    /**
     * Get the csrf.
     * @returns The csrf.
     */
    public csrf(): string | undefined {
        return this._csrf;
    }
}
