import { ServiceFactory } from "../factories/serviceFactory";
import { EventAggregator } from "./eventAggregator";
import { LocalStorageService } from "./localStorageService";

/**
 * Class to use for storing settings.
 */
export class SettingsService {
    /**
     * The blind mode setting.
     */
    private _blindMode: boolean;

    /**
     * The storage servie.
     */
    private readonly _storageService: LocalStorageService;

    /**
     * Create a new instance of SettingsService.
     */
    constructor() {
        this._storageService = ServiceFactory.get<LocalStorageService>("storage");
        this._blindMode = false;
    }

    /**
     * Initialize the service.
     */
    public initialize(): void {
        this._blindMode = this._storageService.load<boolean>("blindMode") ?? false;
    }

    /**
     * Get the blind mode setting.
     * @returns The blind mode.
     */
    public getBlindMode(): boolean {
        return this._blindMode;
    }

    /**
     * Set the blind mode setting.
     * @param blindMode The new blind mode.
     */
    public setBlindMode(blindMode: boolean): void {
        this._blindMode = blindMode;
        this._storageService.save<boolean>("blindMode", this._blindMode);
        EventAggregator.publish("settings.blindMode", this._blindMode);
    }
}
