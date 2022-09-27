/**
 * Fetch from an endpoint.
 */
export class FetchHelper {
    /**
     * Fetch a payload from an endpoint.
     * @param baseUrl The base url for the api.
     * @param path The path for the endpoint.
     * @param method The method to send the request with.
     * @param payload The payload to send.
     * @param headers The headers to include in the fetch.
     * @param timeout Timeout for the request.
     * @returns The fetched payload and any cookies.
     */
    public static async json<T, U>(
        baseUrl: string,
        path: string,
        method: "get" | "post" | "put" | "delete",
        payload?: T,
        headers?: { [id: string]: string },
        timeout?: number
    ): Promise<U> {
        headers = headers ?? {};
        headers["Content-Type"] = "application/json";

        let controller: AbortController | undefined;
        let timerId: NodeJS.Timeout | undefined;

        if (timeout !== undefined) {
            controller = new AbortController();
            timerId = setTimeout(
                () => {
                    if (controller) {
                        controller.abort();
                    }
                },
                timeout);
        }

        try {
            const res = await fetch(
                `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`,
                {
                    method,
                    headers,
                    body: payload ? JSON.stringify(payload) : undefined,
                    signal: controller ? controller.signal : undefined
                });

                const json = (res.status === 204) ? {}
                    : await res.json()
                        .catch(error => {
                            throw new Error(`Fetched failed: ${error.message}`);
                        });

                return json as U;
        } catch (err) {
            if (err instanceof Error) {
                throw err.name === "AbortError" ? new Error("Timeout") : err;
            } else {
                throw err;
            }
        } finally {
            if (timerId) {
                clearTimeout(timerId);
            }
        }
    }

    /**
     * Fetch a payload from an endpoint.
     * @param baseUrl The base url for the api.
     * @param path The path for the endpoint.
     * @param method The method to send the request with.
     * @param payload The payload to send.
     * @param headers The headers to include in the fetch.
     * @param timeout Timeout for the request.
     * @returns The fetched payload and any cookies.
     */
    public static async text<T, U>(
        baseUrl: string,
        path: string,
        method: "get" | "post" | "put" | "delete",
        payload?: T,
        headers?: { [id: string]: string },
        timeout?: number
    ): Promise<U> {
        headers = headers ?? {};
        headers["Content-Type"] = "text/plain";

        let controller: AbortController | undefined;
        let timerId: NodeJS.Timeout | undefined;

        if (timeout !== undefined) {
            controller = new AbortController();
            timerId = setTimeout(
                () => {
                    if (controller) {
                        controller.abort();
                    }
                },
                timeout);
        }

        try {
            const res = await fetch(
                `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`,
                {
                    method,
                    headers,
                    body: payload ? JSON.stringify(payload) : undefined,
                    signal: controller ? controller.signal : undefined
                });
                const json = (res.status === 204) ? {}
                    : await res.json()
                        .catch(error => {
                            throw new Error(`Fetched failed: ${res.statusText}`);
                        });

                return json as U;
        } catch (err) {
            if (err instanceof Error) {
                throw err.name === "AbortError" ? new Error("Timeout") : err;
            } else {
                throw err;
            }
        } finally {
            if (timerId) {
                clearTimeout(timerId);
            }
        }
    }

    /**
     * Join params onto command.
     * @param params The params to add.
     * @returns The joined parameters.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static urlParams(params: { [id: string]: any }): string {
        const urlParams = [];
        for (const key in params) {
            if (params[key] !== null && params[key] !== undefined) {
                urlParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key] as string)}`);
            }
        }
        return urlParams.length > 0 ? `?${urlParams.join("&")}` : "";
    }
}
