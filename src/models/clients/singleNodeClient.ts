// Copyright 2020 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0
import { Converter } from "@iota/util.js";
import { HexEncodedString } from "../hexEncodedTypes";
import { IClient } from "../IClient";
import { INodeInfo } from "../info/INodeInfo";
import { IResponse } from "../IResponse";
import { IPeer } from "../peers/IPeer";
import { IBlock } from "../tangle/IBlock";
import { ClientError } from "./clientError";
import type { SingleNodeClientOptions } from "./singleNodeClientOptions";

/**
 * Client for API communication.
 */
export class SingleNodeClient implements IClient {
    /**
    * The endpoint for the API.
    * @internal
    */
    private readonly _endpoint: string;

    /**
     * The base path for the API.
     * @internal
     */
    private readonly _basePath: string;

    /**
     * The base path for the core API.
     * @internal
     */
    private readonly _coreApiPath: string;

    /**
     * The base path for the management API.
     * @internal
     */
    private readonly _managementApiPath: string;

    /**
     * The Api request timeout.
     * @internal
     */
    private readonly _timeout?: number;

    /**
     * Username for the endpoint.
     * @internal
     */
    private readonly _userName?: string;

    /**
     * Password for the endpoint.
     * @internal
     */
    private readonly _password?: string;

    /**
     * Additional headers to include in the requests.
     * @internal
     */
    private readonly _headers?: { [id: string]: string };

    /**
     * Create a new instance of client.
     * @param endpoint The endpoint.
     * @param options Options for the client.
     */
    constructor(endpoint: string, options?: SingleNodeClientOptions) {
        if (!endpoint) {
            throw new Error("The endpoint can not be empty");
        }
        this._endpoint = endpoint.replace(/\/+$/, "");
        this._basePath = options?.basePath ?? "/api/";
        this._coreApiPath = `${this._basePath}core/v3/`;
        this._managementApiPath = `${this._basePath}management/v1/`;
        this._timeout = options?.timeout;
        this._userName = options?.userName;
        this._password = options?.password;
        this._headers = options?.headers;

        if (this._userName && this._password && !this._endpoint.startsWith("https")) {
            throw new Error("Basic authentication requires the endpoint to be https");
        }

        if (this._userName && this._password && (this._headers?.authorization || this._headers?.Authorization)) {
            throw new Error("You can not supply both user/pass and authorization header");
        }
    }

    /**
     * Get the info about the node.
     * @returns The node information.
     */
    public async info(): Promise<INodeInfo> {
        return this.fetchJson<never, INodeInfo>(this._coreApiPath, "get", "info");
    }

    /**
     * Get the block data by id.
     * @param blockId The block to get the data for.
     * @returns The block data.
     */
    public async block(blockId: HexEncodedString): Promise<IBlock> {
        return this.fetchJson<never, IBlock>(this._coreApiPath, "get", `blocks/${blockId}`);
    }

    /**
     * Add a new peer.
     * @param multiAddress The address of the peer to add.
     * @param alias An optional alias for the peer.
     * @returns The details for the created peer.
     */
    public async peerAdd(multiAddress: string, alias?: string): Promise<IPeer> {
        return this.fetchJson<
            {
                multiAddress: string;
                alias?: string;
            },
            IPeer
        >(this._managementApiPath, "post", "peers", {
            multiAddress,
            alias
        });
    }

    /**
     * Delete a peer.
     * @param peerId The peer to delete.
     * @returns Nothing.
     */
    public async peerDelete(peerId: string): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        return this.fetchJson<never, void>(this._managementApiPath, "delete", `peers/${peerId}`);
    }

    /**
     * Perform a request in json format.
     * @param basePath The base path for the request.
     * @param method The http method.
     * @param route The route of the request.
     * @param requestData Request to send to the endpoint.
     * @returns The response.
     * @internal
     */
    private async fetchJson<T, U>(basePath: string, method: "get" | "post" | "delete", route: string, requestData?: T): Promise<U> {
        const response = await this.fetchWithTimeout(
            method,
            `${basePath}${route}`,
            { "Content-Type": "application/json" },
            requestData ? JSON.stringify(requestData) : undefined
        );

        let errorMessage: string | undefined;
        let errorCode: string | undefined;

        if (response.ok) {
            if (response.status === 204) {
                // No content
                return {} as U;
            }
            try {
                const responseData: U & IResponse = await response.json();

                if (responseData.error) {
                    errorMessage = responseData.error.message;
                    errorCode = responseData.error.code;
                } else {
                    return responseData;
                }
            } catch {}
        }

        if (!errorMessage) {
            try {
                const json = await response.json();
                if (json.error) {
                    errorMessage = json.error.message;
                    errorCode = json.error.code;
                }
            } catch {}
        }

        if (!errorMessage) {
            try {
                const text = await response.text();
                if (text.length > 0) {
                    const match = /code=(\d+), message=(.*)/.exec(text);
                    if (match?.length === 3) {
                        errorCode = match[1];
                        errorMessage = match[2];
                    } else {
                        errorMessage = text;
                    }
                }
            } catch {}
        }

        throw new ClientError(
            errorMessage ?? response.statusText,
            route,
            response.status,
            errorCode ?? response.status.toString()
        );
    }

    /**
     * Perform a fetch request.
     * @param method The http method.
     * @param route The route of the request.
     * @param headers The headers for the request.
     * @param body The request body.
     * @returns The response.
     * @internal
     */
    private async fetchWithTimeout(
        method: "get" | "post" | "delete",
        route: string,
        headers?: { [id: string]: string },
        body?: string | Uint8Array
    ): Promise<Response> {
        let controller: AbortController | undefined;
        let timerId: NodeJS.Timeout | undefined;

        if (this._timeout !== undefined) {
            controller = new AbortController();
            timerId = setTimeout(() => {
                if (controller) {
                    controller.abort();
                }
            }, this._timeout);
        }

        const finalHeaders: { [id: string]: string } = {};

        if (this._headers) {
            for (const header in this._headers) {
                finalHeaders[header] = this._headers[header];
            }
        }

        if (headers) {
            for (const header in headers) {
                finalHeaders[header] = headers[header];
            }
        }

        if (this._userName && this._password) {
            const userPass = Converter.bytesToBase64(Converter.utf8ToBytes(`${this._userName}:${this._password}`));
            finalHeaders.Authorization = `Basic ${userPass}`;
        }

        try {
            const response = await fetch(`${this._endpoint}${route}`, {
                method,
                headers: finalHeaders,
                body,
                signal: controller ? controller.signal : undefined
            });

            return response;
        } catch (err) {
            throw err instanceof Error && err.name === "AbortError" ? new Error("Timeout") : err;
        } finally {
            if (timerId) {
                clearTimeout(timerId);
            }
        }
    }

    /**
     * Combine the query params.
     * @param queryParams The quer params to combine.
     * @returns The combined query params.
     */
    private combineQueryParams(queryParams?: string[]): string {
        return queryParams && queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
    }
}
