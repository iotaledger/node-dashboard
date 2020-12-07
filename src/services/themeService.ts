import { ServiceFactory } from "../factories/serviceFactory";
import { Converter } from "../utils/converter";
import { RandomHelper } from "../utils/randomHelper";
import { LocalStorageService } from "./localStorageService";

/**
 * Class the help with themes.
 */
export class ThemeService {
    /**
     * The theme.
     */
    private _theme: string;

    /**
     * Subscribe to the theme changing.
     */
    private readonly _subscriptions: { [id: string]: () => void };

    /**
     * Create a new instance of ThemeService.
     */
    constructor() {
        this._theme = "light";
        this._subscriptions = {};
    }

    /**
     * Initialize the theme.
     */
    public initialize(): void {
        const storageService = ServiceFactory.get<LocalStorageService>("storage");

        const theme = storageService.load<string>("theme");

        this.apply(theme, false);
    }

    /**
     * Apply a theme.
     * @param theme The theme to apply.
     * @param save Save the theme.
     */
    public apply(theme: string, save: boolean): void {
        const currentTheme = this._theme;
        this._theme = theme ?? "light";

        document.body.classList.remove(`theme-${currentTheme}`);
        document.body.classList.add(`theme-${this._theme}`);

        for (const subscriptionId in this._subscriptions) {
            this._subscriptions[subscriptionId]();
        }

        if (save) {
            this.save();
        }
    }

    /**
     * Get the theme.
     * @returns The theme.
     */
    public get(): string {
        return this._theme;
    }

    /**
     * Save theme.
     */
    public save(): void {
        const storageService = ServiceFactory.get<LocalStorageService>("storage");
        storageService.save("theme", this._theme);
    }

    /**
     * Subscribe to theme changes
     * @param callback Callback to call when the theme changes.
     * @returns The subscription id.
     */
    public subscribe(callback: () => void): string {
        const subscriptionId = Converter.bytesToHex(RandomHelper.generate(32));

        this._subscriptions[subscriptionId] = callback;

        return subscriptionId;
    }

    /**
     * Unsubscribe from theme changes
     * @param subscriptionId The subscription id.
     */
    public unsubscribe(subscriptionId: string): void {
        delete this._subscriptions[subscriptionId];
    }
}
