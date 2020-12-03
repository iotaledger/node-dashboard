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
import { MetricsService } from "./metricsService";

/**
 * Visualizer Service.
 */
export class VisualizerService {
    /**
     * The metrics service.
     */
    private readonly _metricsService: MetricsService;

    /**
     * Metric subscriptions.
     */
    private _subscriptions: string[];

    /**
     * The known nodes.
     */
    private _nodes: {
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
        this._nodes = {};
        this._verticesOrder = [];
        this._verticesLimit = 5000;
        this._counts = {
            solid: 0,
            referenced: 0,
            conflicting: 0,
            tips: 0
        };
        this._metricsService = ServiceFactory.get<MetricsService>("metrics");
    }

    /**
     * Initialize the service.
     */
    public initialize(): void {
        this._subscriptions.push(this._metricsService.subscribe<IVertex>(
            WebSocketTopic.Vertex, data => this.updateVertices(data)));

        this._subscriptions.push(this._metricsService.subscribe<IMilestoneInfo>(
            WebSocketTopic.MilestoneInfo, data => this.updateMilestoneInfo(data)));

        this._subscriptions.push(this._metricsService.subscribe<ITipInfo>(
            WebSocketTopic.TipInfo, data => this.updateTipInfo(data)));

        this._subscriptions.push(this._metricsService.subscribe<IConfirmedInfo>(
            WebSocketTopic.ConfirmedInfo, data => this.updateConfirmedInfo(data)));

        this._subscriptions.push(this._metricsService.subscribe<ISolidInfo>(
            WebSocketTopic.SolidInfo, data => this.updateSolidInfo(data)));
    }

    /**
     * The component will unmount.
     */
    public cleanup(): void {
        for (const subscription of this._subscriptions) {
            this._metricsService.unsubscribe(subscription);
        }
        this._subscriptions = [];
        this._nodes = {};
        this._verticesOrder = [];
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
        this._vertexCallback = vertexCallback;
        this._countsCallback = countsCallback;
        this._referencedCallback = referencedCallback;
    }

    /**
     * Add a new vertex.
     * @param vert The vertex to add.
     */
    private updateVertices(vert: IVertex): void {
        const shortVertId = vert.id.slice(0, 7);

        let node = this._nodes[shortVertId];

        let op: VisualizerVertexOperation = "add";

        if (node) {
            op = "update";
            // can only go from unsolid to solid
            if (!node.isSolid && vert.is_solid) {
                this._counts.solid++;
            }
            if (!node.isReferenced && vert.is_referenced) {
                this._counts.referenced++;
            }
            if (!node.isConflicting && vert.is_conflicting) {
                this._counts.conflicting++;
            }
            if (!node.isTip && vert.is_tip) {
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

            node = {
                fullId: vert.id,
                shortId: shortVertId
            };
        }

        node.parent1Id = vert.parent1_id;
        node.parent2Id = vert.parent2_2;
        node.isSolid = vert.is_solid;
        node.isReferenced = vert.is_referenced;
        node.isConflicting = vert.is_conflicting;
        node.isMilestone = vert.is_milestone;
        node.isTip = vert.is_tip;
        node.isSelected = vert.is_selected;

        this._nodes[shortVertId] = node;

        if (this._vertexCallback) {
            this._vertexCallback(node, op);
        }
        if (this._countsCallback) {
            this._countsCallback(this._counts);
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

                if (vertex) {
                    this.removeVertex(vertex.parent1Id);
                    this.removeVertex(vertex.parent2Id);
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
        let node = this._nodes[vertexId];
        if (node) {
            if (node.isSolid) {
                this._counts.solid--;
            }
            if (node.isReferenced) {
                this._counts.referenced--;
            }
            if (node.isConflicting) {
                this._counts.conflicting--;
            }
            if (node.isTip) {
                this._counts.tips--;
            }
            delete this._nodes[vertexId];
        } else {
            node = { shortId: vertexId };
        }

        if (this._vertexCallback) {
            this._vertexCallback(node, "delete");
        }

        return node;
    }

    /**
     * Update the tip information.
     * @param data The tip info data.
     */
    private updateTipInfo(data: ITipInfo) {
        const node = this._nodes[data.id];
        if (node && node.isTip !== !data.is_tip) {
            if (node.isTip && !data.is_tip) {
                this._counts.tips--;
            } else {
                this._counts.tips++;
            }
            node.isTip = data.is_tip;
            if (this._vertexCallback) {
                this._vertexCallback(node, "update");
            }
            if (this._countsCallback) {
                this._countsCallback(this._counts);
            }
        }
    }

    /**
     * Update the milestone information.
     * @param data The milestone info data.
     */
    private updateMilestoneInfo(data: IMilestoneInfo) {
        const node = this._nodes[data.id];
        if (node) {
            node.isMilestone = true;
            if (this._vertexCallback) {
                this._vertexCallback(node, "update");
            }
        }
    }

    /**
     * Update the confirmed information.
     * @param data The confirmed info data.
     */
    private updateConfirmedInfo(data: IConfirmedInfo) {
        const node = this._nodes[data.id];
        if (node && !node.isReferenced) {
            if (this._referencedCallback) {
                this._referencedCallback(data.id, data.excluded_ids ?? [], this._counts);
            }

            if (this._countsCallback) {
                this._countsCallback(this._counts);
            }
        }
    }

    /**
     * Update the solid information.
     * @param data The solid info data.
     */
    private updateSolidInfo(data: ISolidInfo) {
        const node = this._nodes[data.id];
        if (node && !node.isSolid) {
            node.isSolid = true;
            this._counts.solid++;

            if (this._vertexCallback) {
                this._vertexCallback(node, "update");
            }

            if (this._countsCallback) {
                this._countsCallback(this._counts);
            }
        }
    }
}
