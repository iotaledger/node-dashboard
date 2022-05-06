/**
 * Class to use session storage.
 */
 export class SessionStorageService {
    /**
     * Load an item from session storage.
     * @param key The key of the item to load.
     * @returns The item loaded.
     */
    public load<T>(key: string): T {
        let obj;
        if (window.sessionStorage) {
            try {
                const json = window.sessionStorage.getItem(key);

                if (json) {
                    obj = JSON.parse(json);
                }
            } catch {
                // Nothing to do
            }
        }

        return obj as T;
    }

    /**
     * Save an item to session storage.
     * @param key The key of the item to store.
     * @param item The item to store.
     */
    public save<T>(key: string, item: T): void {
        if (window.sessionStorage) {
            try {
                const json = JSON.stringify(item);
                window.sessionStorage.setItem(key, json);
            } catch {
                // Nothing to do
            }
        }
    }

    /**
     * Delete an item in session storage.
     * @param key The key of the item to store.
     */
    public remove(key: string): void {
        if (window.sessionStorage) {
            try {
                window.sessionStorage.removeItem(key);
            } catch {
                // Nothing to do
            }
        }
    }

    /**
     * Clear the session storage.
     * @param rootKey Clear all items that start with the root key, if undefined clear everything.
     */
    public clear(rootKey: string): void {
        if (window.sessionStorage) {
            try {
                if (rootKey) {
                    const keysToRemove = [];
                    const len = window.sessionStorage.length;
                    for (let i = 0; i < len; i++) {
                        const key = window.sessionStorage.key(i);
                        if (key?.startsWith(rootKey)) {
                            keysToRemove.push(key);
                        }
                    }
                    for (const key of keysToRemove) {
                        window.sessionStorage.removeItem(key);
                    }
                } else {
                    window.sessionStorage.clear();
                }
            } catch {
                // Nothing to do
            }
        }
    }
}
