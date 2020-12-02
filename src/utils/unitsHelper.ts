import { Units } from "../models/units";

/**
 * Class to help with units formatting.
 */
export class UnitsHelper {
    /**
     * Map units.
     */
    private static readonly UNIT_MAP: { [unit: string]: { val: bigint; dp: number } } = {
        i: { val: BigInt(1), dp: 0 },
        Ki: { val: BigInt(1000), dp: 3 },
        Mi: { val: BigInt(1000000), dp: 6 },
        Gi: { val: BigInt(1000000000), dp: 9 },
        Ti: { val: BigInt(1000000000000), dp: 12 },
        Pi: { val: BigInt(1000000000000000), dp: 15 }
    };

    /**
     * Format the value in the best units.
     * @param value The value to format.
     * @returns The formated value.
     */
    public static formatBest(value: number): string {
        return UnitsHelper.formatUnits(value, UnitsHelper.calculateBest(value));
    }

    /**
     * Format the value in the best units.
     * @param value The value to format.
     * @param unit The unit for format with.
     * @returns The formated value.
     */
    public static formatUnits(value: number, unit: Units): string {
        return unit === "i" ? `${value} i` : `${UnitsHelper.convertUnits(value, "i", unit).toFixed(2)} ${unit}`;
    }

    /**
     * Format the value in the best units.
     * @param value The value to format.
     * @returns The best units for the value.
     */
    public static calculateBest(value: number): Units {
        let bestUnits: Units = "i";
        const checkLength = Math.abs(value).toString().length;

        if (checkLength > UnitsHelper.UNIT_MAP.Pi.dp) {
            bestUnits = "Pi";
        } else if (checkLength > UnitsHelper.UNIT_MAP.Ti.dp) {
            bestUnits = "Ti";
        } else if (checkLength > UnitsHelper.UNIT_MAP.Gi.dp) {
            bestUnits = "Gi";
        } else if (checkLength > UnitsHelper.UNIT_MAP.Mi.dp) {
            bestUnits = "Mi";
        } else if (checkLength > UnitsHelper.UNIT_MAP.Ki.dp) {
            bestUnits = "Ki";
        }

        return bestUnits;
    }

    /**
     * Convert the value to different units.
     * @param value The value to convert.
     * @param fromUnit The form unit.
     * @param toUnit The to unit.
     * @returns The formatted unit.
     */
    private static convertUnits(value: string | number, fromUnit: Units, toUnit: Units): number {
        return Number(BigInt(value) * UnitsHelper.UNIT_MAP[fromUnit].val / UnitsHelper.UNIT_MAP[toUnit].val);
    }
}
