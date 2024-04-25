import { ServiceFactory } from "../factories/serviceFactory";
import { FetchHelper } from "../utils/fetchHelper";
import { AuthService } from "./authService";
/**
 * Service to handle getting confiuration from the dashboard backend.
 */
export class DashboardConfigService {
    /**
     * The explorer URL.
     */
    private _explorerURL: string;

    /**
     * The auth service.
     */
    private readonly _authService: AuthService;

    /**
     * Create a new instance of DashboardConfigService.
     */
    constructor() {
        this._authService = ServiceFactory.get<AuthService>("auth");
        this._explorerURL = "";
    }

    /**
     * Initialise DashboardConfigService.
     */
    public async initialize(): Promise<void> {
        try {
            this._explorerURL = await this.getExplorerURLBackend();
        } catch {}
    }

    /**
     * Get the explorer URL.
     * @returns The explorer URL.
     */
    public getExplorerURL(): string {
        return this._explorerURL;
    }

    /**
     * Get the explorer URL from the backend.
     * @returns The explorer URL.
     */
    private async getExplorerURLBackend(): Promise<string> {
        const headers = this._authService.buildAuthHeaders();

        const response = await FetchHelper.json<undefined, {
            explorerUrl: string;
        }>(
            `${window.location.protocol}//${window.location.host}`,
            "/dashboard/settings",
            "get",
            undefined,
            headers);

        return response.explorerUrl;
    }
}
