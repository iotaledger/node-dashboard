/**
 * Class to help with random generation.
 */
export class RandomHelper {
    /**
     * Generate a new random array.
     * @param length The length of buffer to create.
     * @returns The random array.
     */
    public static generate(length: number): Uint8Array {
        const randomBytes = new Uint8Array(length);
        globalThis.crypto.getRandomValues(randomBytes);
        return randomBytes;
    }
}
