/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { IBrandConfiguration } from "../models/IBrandConfiguration";

export class BrandHelper {
    /**
     * The brand id from the environment.
     */
    private static readonly _brandId?: string = process.env.REACT_APP_BRAND_ID;

    /**
     * The brand configuration.
     */
    private static _brandConfiguration: IBrandConfiguration;

    /**
     * Initialize the branding.
     * @returns The brand configuration.
     */
    public static initialize(): IBrandConfiguration | undefined {
        if (BrandHelper._brandId) {
            BrandHelper._brandConfiguration = require(`../assets/${BrandHelper._brandId}/brand.json`);
            document.title = `${BrandHelper._brandConfiguration.name} Dashboard`;

            return BrandHelper._brandConfiguration;
        }
    }

    /**
     * Get the configuration.
     * @returns The configuration.
     */
    public static getConfiguration(): IBrandConfiguration {
        return BrandHelper._brandConfiguration;
    }

    /**
     * Get the logo for the navigation panel.
     * @param theme The current theme.
     * @returns The navigation panel logo.
     */
    public static async getLogoNavigation(theme: string): Promise<string> {
        return (await import(`../assets/${BrandHelper._brandId}/themes/${theme}/logo-navigation.svg`)).default;
    }

    /**
     * Get the logo for the home page banner.
     * @param theme The current theme.
     * @returns The banner panel logo.
     */
    public static async getBanner(theme: string): Promise<string> {
        return (await import(`../assets/${BrandHelper._brandId}/themes/${theme}/banner.svg`)).default;
    }
}
