import { ServiceFactory } from "../factories/serviceFactory";
import { IVertex } from "../models/visualizer/IVertex";
import { IVerticesCounts } from "../models/visualizer/IVerticesCounts";
import { VisualizerVertexOperation } from "../models/visualizer/visualizerVertexOperation";
import { ISyncStatus } from "../models/websocket/ISyncStatus";
import { IVisualizerBlockStateInfo } from "../models/websocket/IVisualizerBlockStateInfo";
import { IVisualizerTipInfo } from "../models/websocket/IVisualizerTipInfo";
import { IVisualizerVertex } from "../models/websocket/IVisualizerVertex";
import { WebSocketTopic } from "../models/websocket/webSocketTopic";
import { DataHelper } from "../utils/dataHelper";
import { WebSocketService } from "./webSocketService";

/**
 * Visualizer Service.
 */
export class VisualizerService {
    /**
     * The web socket service.
     */
    private readonly _webSocketService: WebSocketService;

    /**
     * Web socket subscriptions.
     */
    private _subscriptions: string[];

    /**
     * The known vertices.
     */
    private _vertices: {
        [id: string]: IVertex;
    };

    /**
     * The ordered vertices.
     */
    private _verticesOrder: string[];

    /**
     * The counts.
     */
    private readonly _counts: IVerticesCounts;

    /**
     * The maximum number of vertices.
     */
    private readonly _verticesLimit: number;

    /**
     * The vertex update callback.
     */
    private _vertexCallback?: (vertex: IVertex, operation: VisualizerVertexOperation) => void;

    /**
     * The counts were updated callback.
     */
    private _countsCallback?: (counts: IVerticesCounts) => void;

    /**
     * Create a new instance of VisualizerService.
     */
    constructor() {
        this._subscriptions = [];
        this._vertices = {};
        this._verticesOrder = [];
        this._verticesLimit = 5000;
        this._counts = {
            total: 0,
            accepted: 0,
            confirmed: 0,
            finalized: 0,
            transactions: 0,
            tips: 0
        };
        this._webSocketService = ServiceFactory.get<WebSocketService>("web-socket");
    }

    /**
     * The callback triggered with vertex updates.
     * @param vertexCallback The vertex callback.
     * @param countsCallback The counts callback.
     */
    public subscribe(
        vertexCallback: (vertex: IVertex, operation: VisualizerVertexOperation) => void,
        countsCallback: (counts: IVerticesCounts) => void): void {
        this._subscriptions.push(
            this._webSocketService.subscribe<ISyncStatus>(
                WebSocketTopic.SyncStatus,
                false,
                data => this.updateSyncStatus(data)
            ),
            this._webSocketService.subscribe<IVisualizerVertex>(
                WebSocketTopic.VisualizerVertex,
                false,
                data => this.updateVertices(data)
            ),
            this._webSocketService.subscribe<IVisualizerTipInfo>(
                WebSocketTopic.VisualizerTipInfo,
                false,
                data => this.updateTipInfo(data)
            ),
            this._webSocketService.subscribe<IVisualizerBlockStateInfo>(
                WebSocketTopic.VisualizerBlockStateInfo,
                false,
                data => this.updateBlockStateInfo(data)
            ));

        this._vertexCallback = vertexCallback;
        this._countsCallback = countsCallback;
    }

    /**
     * Unsubscribe and cleanup.
     */
    public unsubscribe(): void {
        for (const subscription of this._subscriptions) {
            this._webSocketService.unsubscribe(subscription);
        }
        this._subscriptions = [];
        this._vertices = {};
        this._verticesOrder = [];

        // reset counts
        this._counts.total = 0;
        this._counts.accepted = 0;
        this._counts.confirmed = 0;
        this._counts.finalized = 0;
        this._counts.transactions = 0;
        this._counts.tips = 0;
    }

    /**
     * Updates the sync status of the visualizer.
     * @param data The sync status data.
     */
    private updateSyncStatus(data?: ISyncStatus) {
        if (data) {
            for (const vertex of Object.values(this._vertices)) {
                if (vertex.isFinalized) {
                    // already finalized
                    continue;
                }

                if (!vertex.isAccepted && !vertex.isConfirmed) {
                    // not accepted or confirmed
                    continue;
                }

                if (vertex.slot !== undefined && vertex.slot <= data.latestFinalizedSlot) {
                    vertex.isFinalized = true;
                    this._counts.finalized++;

                    if (this._vertexCallback) {
                        this._vertexCallback(vertex, "update");
                    }
                    if (this._countsCallback) {
                        this._countsCallback(this._counts);
                    }
                }
            }
        }
    }

    /**
     * Add a new vertex.
     * @param vert The vertex to add.
     */
    private updateVertices(vert?: IVisualizerVertex): void {
        if (vert) {
            const shortVertId = vert.id.slice(0, 10);

            let vertex = this._vertices[shortVertId];

            let op: VisualizerVertexOperation = "add";

            if (!vertex) {
                if (vert.isBasicBlockSignedTransaction) {
                    this._counts.transactions++;
                }
                this._verticesOrder.push(shortVertId);
                this.checkLimit();

                vertex = {
                    fullId: vert.id,
                    shortId: shortVertId,
                    slot: DataHelper.computeSlotIndex(vert.id)
                };
            } else {
                op = "update";
            }

            vertex.parents = vert.parents;
            vertex.blockState = vert.blockState;
            vertex.isBasicBlockTaggedData = vert.isBasicBlockTaggedData;
            vertex.isBasicBlockSignedTransaction = vert.isBasicBlockSignedTransaction;
            vertex.isBasicBlockCandidacyAnnouncement = vert.isBasicBlockCandidacyAnnouncement;
            vertex.isValidationBlock = vert.isValidationBlock;
            if (!vertex.isTip && vert.isTip) {
                this._counts.tips++;
            } else if (vertex.isTip && !vert.isTip) {
                this._counts.tips--;
            }
            vertex.isTip = vert.isTip;

            this.updateVertexBlockStateInfo(vertex, vert.blockState);

            this._vertices[shortVertId] = vertex;

            this._counts.total = this._verticesOrder.length;

            if (this._vertexCallback) {
                this._vertexCallback(vertex, op);
            }
            if (this._countsCallback) {
                this._countsCallback(this._counts);
            }
        }
    }

    /**
     * Check the number of vertices.
     */
    private checkLimit(): void {
        while (this._verticesOrder.length > this._verticesLimit) {
            const deleteId = this._verticesOrder.shift();

            if (deleteId) {
                const vertex = this.removeVertex(deleteId);

                if (vertex?.parents) {
                    for (const parent of vertex.parents) {
                        this.removeVertex(parent);
                    }
                }
            }
        }

        if (this._countsCallback) {
            this._countsCallback(this._counts);
        }
    }

    /**
     * Delete a vertex.
     * @param vertexId The id of the vertex to delete.
     * @returns The deleted vertex.
     */
    private removeVertex(vertexId: string | undefined): IVertex | undefined {
        if (!vertexId) {
            return;
        }
        let vertex = this._vertices[vertexId];
        if (vertex) {
            if (vertex.isAccepted) {
                this._counts.accepted--;
            }
            if (vertex.isConfirmed) {
                this._counts.confirmed--;
            }
            if (vertex.isFinalized) {
                this._counts.finalized--;
            }
            if (vertex.isBasicBlockSignedTransaction) {
                this._counts.transactions--;
            }
            if (vertex.isTip) {
                this._counts.tips--;
            }

            delete this._vertices[vertexId];
        } else {
            vertex = { shortId: vertexId };
        }

        if (this._vertexCallback) {
            this._vertexCallback(vertex, "delete");
        }

        return vertex;
    }

    /**
     * Update the tip information.
     * @param data The tip info data.
     */
    private updateTipInfo(data?: IVisualizerTipInfo) {
        if (data) {
            const vertex = this._vertices[data.id];
            if (vertex) {
                if (!vertex.isTip && data.isTip) {
                    this._counts.tips++;
                } else if (vertex.isTip && !data.isTip) {
                    this._counts.tips--;
                }
                vertex.isTip = data.isTip;
                if (this._vertexCallback) {
                    this._vertexCallback(vertex, "update");
                }
                if (this._countsCallback) {
                    this._countsCallback(this._counts);
                }
            }
        }
    }

    private updateVertexBlockStateInfo(vertex: IVertex, blockState: string): boolean {
        if (vertex) {
            let updated = false;
            switch (blockState) {
                case "accepted":
                    if (!vertex.isAccepted) {
                        this._counts.accepted++;
                        updated = true;
                        vertex.isAccepted = true;
                    }
                    break;
                case "confirmed":
                    if (!vertex.isConfirmed) {
                        this._counts.confirmed++;
                        updated = true;
                        vertex.isConfirmed = true;
                    }
                    break;
                default:
                    break;
            }

            return updated;
        }

        return false;
    }

    /**
     * Update the solid information.
     * @param data The solid info data.
     */
    private updateBlockStateInfo(data?: IVisualizerBlockStateInfo) {
        if (data) {
            const vertex = this._vertices[data.id];

            if (!this.updateVertexBlockStateInfo(vertex, data.blockState)) {
                return;
            }

            if (this._vertexCallback) {
                this._vertexCallback(vertex, "update");
            }

            if (this._countsCallback) {
                this._countsCallback(this._counts);
            }
        }
    }
}
