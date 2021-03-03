import { ServiceFactory } from "../factories/serviceFactory";
import { IVisualizerCounts } from "../models/visualizer/IVisualizerCounts";
import { IVisualizerVertex } from "../models/visualizer/IVisualizerVertex";
import { VisualizerVertexOperation } from "../models/visualizer/visualizerVertexOperation";
import { IConfirmedInfo } from "../models/websocket/IConfirmedInfo";
import { IMilestoneInfo } from "../models/websocket/IMilestoneInfo";
import { ISolidInfo } from "../models/websocket/ISolidInfo";
import { ITipInfo } from "../models/websocket/ITipInfo";
import { IVertex } from "../models/websocket/IVertex";
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
        [id: string]: IVisualizerVertex;
    };

    /**
     * The ordered vertices.
     */
    private _verticesOrder: string[];

    /**
     * The counts.
     */
    private readonly _counts: IVisualizerCounts;

    /**
     * The maximum number of vertices.
     */
    private readonly _verticesLimit: number;

    /**
     * The vertex update callback.
     */
    private _vertexCallback?: (vertex: IVisualizerVertex, operation: VisualizerVertexOperation) => void;

    /**
     * The counts were updated callback.
     */
    private _countsCallback?: (counts: IVisualizerCounts) => void;

    /**
     * The referenced callback.
     */
    private _referencedCallback?: (id: string, excluded: string[], count: IVisualizerCounts) => void;

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
        vertexCallback: (vertex: IVisualizerVertex, operation: VisualizerVertexOperation) => void,
        countsCallback: (counts: IVisualizerCounts) => void,
        referencedCallback: (id: string, excluded: string[], count: IVisualizerCounts) => void): void {
        this._subscriptions.push(
            this._webSocketService.subscribe<IVertex>(
                WebSocketTopic.Vertex,
                false,
                data => this.updateVertices(data)
            ),
            this._webSocketService.subscribe<IMilestoneInfo>(
                WebSocketTopic.MilestoneInfo,
                false,
                data => this.updateMilestoneInfo(data)
            ),
            this._webSocketService.subscribe<ITipInfo>(
                WebSocketTopic.TipInfo,
                false,
                data => this.updateTipInfo(data)
            ),
            this._webSocketService.subscribe<IConfirmedInfo>(
                WebSocketTopic.ConfirmedInfo,
                false,
                data => this.updateConfirmedInfo(data)
            ),
            this._webSocketService.subscribe<ISolidInfo>(
                WebSocketTopic.SolidInfo,
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
    }

    /**
     * Add a new vertex.
     * @param vert The vertex to add.
     */
    private updateVertices(vert?: IVertex): void {
        if (vert) {
            const shortVertId = vert.id.slice(0, 7);

            let vertex = this._vertices[shortVertId];

            let op: VisualizerVertexOperation = "add";

            if (vertex) {
                op = "update";
                // can only go from unsolid to solid
                if (!vertex.isSolid && vert.is_solid) {
                    this._counts.solid++;
                }
                if (!vertex.isReferenced && vert.is_referenced) {
                    this._counts.referenced++;
                }
                if (!vertex.isConflicting && vert.is_conflicting) {
                    this._counts.conflicting++;
                }
                if (!vertex.isTip && vert.is_tip) {
                    this._counts.tips++;
                }
            } else {
                if (vert.is_solid) {
                    this._counts.solid++;
                }
                if (vert.is_referenced) {
                    this._counts.referenced++;
                }
                if (vert.is_conflicting) {
                    this._counts.conflicting++;
                }
                if (vert.is_tip) {
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
            vertex.isSolid = vert.is_solid;
            vertex.isReferenced = vert.is_referenced;
            vertex.isConflicting = vert.is_conflicting;
            vertex.isMilestone = vert.is_milestone;
            vertex.isTip = vert.is_tip;
            vertex.isSelected = vert.is_selected;

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
    private removeVertex(vertexId: string | undefined): IVisualizerVertex | undefined {
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
    private updateTipInfo(data?: ITipInfo) {
        if (data) {
            const vertex = this._vertices[data.id];
            if (vertex) {
                this._counts.tips += data.is_tip ? 1 : (vertex.isTip ? -1 : 0);
                vertex.isTip = data.is_tip;
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
    private updateMilestoneInfo(data?: IMilestoneInfo) {
        if (data) {
            const vertex = this._vertices[data.id];
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
    private updateConfirmedInfo(data?: IConfirmedInfo) {
        if (data) {
            const vertex = this._vertices[data.id];
            if (vertex && !vertex.isReferenced) {
                if (this._referencedCallback) {
                    this._referencedCallback(data.id, data.excluded_ids ?? [], this._counts);
                }

                if (this._countsCallback) {
                    this._countsCallback(this._counts);
                }
            }
        }
    }

    /**
     * Update the solid information.
     * @param data The solid info data.
     */
    private updateSolidInfo(data?: ISolidInfo) {
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
