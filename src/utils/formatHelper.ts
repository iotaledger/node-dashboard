import { INodeInfoBaseToken, UnitsHelper } from "@iota/iota.js";
import humanize from "humanize-duration";
import moment from "moment";
import { ServiceFactory } from "../factories/serviceFactory";
import { NodeConfigService } from "../services/nodeConfigService";

/**
 * Class to help formatting values.
 */
export class FormatHelper {
    /**
     * The singleton instance.
     */
    private static instance: FormatHelper;

    /**
     * The base token of the node.
     */
    private readonly _baseToken: INodeInfoBaseToken;

    /**
     * Create a new instance FormatHelper.
     */
    private constructor() {
        const nodeConfigService = ServiceFactory.get<NodeConfigService>("node-config");
        this._baseToken = nodeConfigService.getBaseToken();
    }

    /**
     * Get the FormatHelper singleton instance.
     * @returns the FormatHelper instance.
     */
    public static getInstance(): FormatHelper {
        if (!FormatHelper.instance) {
            FormatHelper.instance = new FormatHelper();
        }

        return FormatHelper.instance;
    }

    /**
     * Format the duration as human readable.
     * @param milliseconds The milliseconds total for the duration.
     * @returns The formatted duration.
     */
    public static duration(milliseconds: number): string {
        if (milliseconds < 3600000) {
            return humanize(milliseconds, { largest: 1, round: true });
        }

        return humanize(milliseconds, { largest: 2, round: true });
    }

    /**
     * Format the bytes to a human readable size. (SI standard)
     * @param bytes The bytes to format.
     * @param decimalPlaces The number of decimal places.
     * @returns The formatted string.
     */
    public static size(bytes: number, decimalPlaces: number = 2): string {
        if (!bytes) {
            return "0 bytes";
        }

        const index = Math.floor(Math.log(bytes) / Math.log(1000));
        const units = ["bytes", "kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

        const value = Number((bytes / Math.pow(1000, index)).toFixed(decimalPlaces));
        let unit = units[index];

        if (unit === "bytes" && value === 1) {
            unit = "byte";
        }

        if (unit === undefined) {
            return bytes.toFixed(decimalPlaces).toString();
        }

        return `${value} ${unit}`;
    }

    /**
     * Format the bytes to a human readable size. (IEC standard)
     * @param bytes The bytes to format.
     * @param decimalPlaces The number of decimal places.
     * @returns The formatted string.
     */
     public static iSize(bytes: number, decimalPlaces: number = 2): string {
        if (!bytes) {
            return "0 bytes";
        }

        const index = Math.floor(Math.log(bytes) / Math.log(1024));
        const units = ["bytes", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];

        const value = Number((bytes / Math.pow(1024, index)).toFixed(decimalPlaces));
        let unit = units[index];

        if (unit === "bytes" && value === 1) {
            unit = "byte";
        }

        if (unit === undefined) {
            return bytes.toFixed(decimalPlaces).toString();
        }

        return `${value} ${unit}`;
    }

    /**
     * Format the date.
     * @param valueInMs The value to format in milliseconds.
     * @param human Humanize the date.
     * @returns The formated value.
     */
    public static date(valueInMs: number, human: boolean = true): string {
        valueInMs = FormatHelper.milliseconds(valueInMs);

        const timeMoment = moment(valueInMs);
        let formatted = timeMoment.format("LLLL");

        if (human) {
            const postDate = valueInMs > Date.now() ? "in the future" : "ago";

            formatted += ` - ${moment.duration(moment().diff(timeMoment)).humanize()} ${postDate}`;
        }
        return formatted;
    }

    /**
     * Format the date in short format.
     * @param valueInMs The value to format in milliseconds.
     * @returns The formated value.
     */
    public static dateShort(valueInMs: number): string {
        return moment(FormatHelper.milliseconds(valueInMs)).format("YYYY-MM-DD HH:mm");
    }

    /**
     * Check the value is in ms if not scale accordingly.
     * @param valueInMs The value to format in milliseconds.
     * @returns The updated value.
     */
    public static milliseconds(valueInMs: number): number {
        const asStringLength = valueInMs.toString().length;

        // If there are less than 13 digits this must be in seconds
        // https://stackoverflow.com/questions/23929145/how-to-test-if-a-given-time-stamp-is-in-seconds-or-milliseconds
        if (asStringLength < 13) {
            return valueInMs * 1000;
        }
        return valueInMs;
    }

    /**
     * Format amount.
     * @param value The value to format.
     * @param formatFull Return full format.
     * @param decimalPlaces The number of decimal places.
     * @returns The formatted amount.
     */
    public amount(value: number, formatFull: boolean, decimalPlaces: number = 2): string {
        if (formatFull) {
            return `${value} ${this._baseToken.subunit ? this._baseToken.subunit : this._baseToken.unit}`;
        }
        const baseTokeValue = value / Math.pow(10, this._baseToken.decimals);
        const amount = this._baseToken.useMetricPrefix
                    ? UnitsHelper.formatBest(baseTokeValue)
                    : `${Number.parseFloat(baseTokeValue.toFixed(decimalPlaces))} `;

        return `${amount}${this._baseToken.unit}`;
    }
}
