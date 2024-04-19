import { ServiceFactory } from "../factories/serviceFactory";
import { IVertex } from "../models/visualizer/IVertex";
import { IVerticesCounts } from "../models/visualizer/IVerticesCounts";
import { VisualizerVertexOperation } from "../models/visualizer/visualizerVertexOperation";
import { IVisualizerCommitmentInfo } from "../models/websocket/ICommitment";
import { IVisualizerConfirmationInfo } from "../models/websocket/IVisualizerConfirmationInfo";
import { IVisualizerMetaInfo } from "../models/websocket/IVisualizerMetaInfo";
import { IVisualizerTipInfo } from "../models/websocket/IVisualizerTipInfo";
import { IVisualizerVertex } from "../models/websocket/IVisualizerVertex";
import { WebSocketTopic } from "../models/websocket/webSocketTopic";
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
     * The referenced callback.
     */
    private _referencedCallback?: (id: string, excluded: string[], count: IVerticesCounts) => void;

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
            solid: 0,
            referenced: 0,
            transactions: 0,
            conflicting: 0,
            tips: 0
        };
        this._webSocketService = ServiceFactory.get<WebSocketService>("web-socket");
    }

    /**
     * The callback triggered with vertex updates.
     * @param vertexCallback The vertex callback.
     * @param countsCallback The counts callback.
     * @param referencedCallback The referenced callback.
     */
    public subscribe(
        vertexCallback: (vertex: IVertex, operation: VisualizerVertexOperation) => void,
        countsCallback: (counts: IVerticesCounts) => void,
        referencedCallback: (id: string, excluded: string[], count: IVerticesCounts) => void): void {
        this._subscriptions.push(
            this._webSocketService.subscribe<IVisualizerVertex>(
                WebSocketTopic.VisualizerVertex,
                false,
                data => this.updateVertices(data)
            ),
            this._webSocketService.subscribe<IVisualizerCommitmentInfo>(
                WebSocketTopic.VisualizerCommitmentInfo,
                false,
                data => this.updateCommitmentInfo(data)
            ),
            this._webSocketService.subscribe<IVisualizerTipInfo>(
                WebSocketTopic.VisualizerTipInfo,
                false,
                data => this.updateTipInfo(data)
            ),
            this._webSocketService.subscribe<IVisualizerConfirmationInfo>(
                WebSocketTopic.VisualizerConfirmationInfo,
                false,
                data => this.updateConfirmationInfo(data)
            ),
            this._webSocketService.subscribe<IVisualizerMetaInfo>(
                WebSocketTopic.VisualizerSolidInfo,
                false,
                data => this.updateSolidInfo(data)
            ));

        this._vertexCallback = vertexCallback;
        this._countsCallback = countsCallback;
        this._referencedCallback = referencedCallback;
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
        this._counts.solid = 0;
        this._counts.referenced = 0;
        this._counts.transactions = 0;
        this._counts.conflicting = 0;
        this._counts.tips = 0;
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

            if (vertex) {
                op = "update";
                // can only go from unsolid to solid
                if (!vertex.isSolid && vert.isSolid) {
                    this._counts.solid++;
                }
                if (!vertex.isReferenced && vert.isReferenced) {
                    this._counts.referenced++;
                }
                if (!vertex.isConflicting && vert.isConflicting) {
                    this._counts.conflicting++;
                }
                if (!vertex.isTip && vert.isTip) {
                    this._counts.tips++;
                }
            } else {
                if (vert.isSolid) {
                    this._counts.solid++;
                }
                if (vert.isReferenced) {
                    this._counts.referenced++;
                }
                if (vert.isTransaction) {
                    this._counts.transactions++;
                }
                if (vert.isConflicting) {
                    this._counts.conflicting++;
                }
                if (vert.isTip) {
                    this._counts.tips++;
                }

                this._verticesOrder.push(shortVertId);
                this.checkLimit();

                vertex = {
                    fullId: vert.id,
                    shortId: shortVertId
                };
            }

            vertex.parents = vert.parents;
            vertex.isSolid = vert.isSolid;
            vertex.isReferenced = vert.isReferenced;
            vertex.isTransaction = vert.isTransaction;
            vertex.isConflicting = vert.isConflicting;
            vertex.isMilestone = vert.isMilestone;
            vertex.isTip = vert.isTip;
            vertex.isSelected = vert.isSelected;

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
            if (vertex.isSolid) {
                this._counts.solid--;
            }
            if (vertex.isReferenced) {
                this._counts.referenced--;
            }
            if (vertex.isTransaction) {
                this._counts.transactions--;
            }
            if (vertex.isConflicting) {
                this._counts.conflicting--;
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
                this._counts.tips += data.isTip ? 1 : (vertex.isTip ? -1 : 0);
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

    /**
     * Update the milestone information.
     * @param data The milestone info data.
     */
    private updateCommitmentInfo(data?: IVisualizerCommitmentInfo) {
        if (data) {
            const vertex = this._vertices[data.commitmentId];
            if (vertex) {
                vertex.isMilestone = true;
                if (this._vertexCallback) {
                    this._vertexCallback(vertex, "update");
                }
            }
        }
    }

    /**
     * Update the confirmed information.
     * @param data The confirmed info data.
     */
    private updateConfirmationInfo(data?: IVisualizerConfirmationInfo) {
        if (data) {
            for (const id of data.ids) {
                const vertex = this._vertices[id];
                if (vertex && !vertex.isReferenced) {
                    if (this._referencedCallback) {
                        this._referencedCallback(id, data.excludedIds ?? [], this._counts);
                    }

                    if (this._countsCallback) {
                        this._countsCallback(this._counts);
                    }
                }
            }
        }
    }

    /**
     * Update the solid information.
     * @param data The solid info data.
     */
    private updateSolidInfo(data?: IVisualizerMetaInfo) {
        if (data) {
            const vertex = this._vertices[data.id];
            if (vertex && !vertex.isSolid) {
                vertex.isSolid = true;
                this._counts.solid++;

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
