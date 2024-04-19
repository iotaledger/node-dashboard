/**
 * Options used when constructing SingleNodeClient.
 */
export interface SingleNodeClientOptions {
    /**
     * Base path for API location, defaults to /api/.
     */
    basePath?: string;
    /**
     * Timeout for API requests.
     */
    timeout?: number;
    /**
     * Username for the endpoint.
     */
    userName?: string;
    /**
     * Password for the endpoint.
     */
    password?: string;
    /**
     * Additional headers to include in the requests.
     */
    headers?: {
        [id: string]: string;
    };
}
