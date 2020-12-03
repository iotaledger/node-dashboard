import React, { ReactNode } from "react";
import Viva from "vivagraphjs";
import { ServiceFactory } from "../../factories/serviceFactory";
import { IVisualizerCounts } from "../../models/visualizer/IVisualizerCounts";
import { IVisualizerVertex } from "../../models/visualizer/IVisualizerVertex";
import { VisualizerService } from "../../services/visualizerService";
import AsyncComponent from "../components/layout/AsyncComponent";
import "./Visualizer.scss";
import { VisualizerState } from "./VisualizerState";

/**
 * Visualizer panel.
 */
class Visualizer extends AsyncComponent<unknown, VisualizerState> {
    private static readonly COLOR_SOLID = 0x4CAAFFFF;

    private static readonly COLOR_UNSOLID = 0x8FE6FAFF;

    private static readonly COLOR_REFERENCED = 0x61E884FF;

    private static readonly COLOR_CONFLICTING = 0xFF8B5CFF;

    private static readonly COLOR_MILESTONE = 0x666AF6FF;

    private static readonly COLOR_TIP = 0xFFCA62FF;

    private static readonly COLOR_UNKNOWN = 0x9AADCEFF;

    private static readonly COLOR_SELECTED = 0xFDF6E3FF;

    private static readonly COLOR_LINK = 0xCEDAEEFF;

    private static readonly COLOR_LINK_CHILDREN = 0xFF5AAAFF;

    private static readonly COLOR_LINK_PARENTS = 0xFFC306FF;

    private static readonly VERTEX_SIZE_SMALL = 10;

    private static readonly VERTEX_SIZE_MEDIUM = 20;

    private static readonly VERTEX_SIZE_LARGE = 30;

    /**
     * The graph element.
     */
    private _graphElement: HTMLElement | null;

    /**
     * The graph instance.
     */
    private _graph?: Viva.Graph.IGraph<IVisualizerVertex, unknown>;

    /**
     * The renderer instance.
     */
    private _renderer?: Viva.Graph.View.IRenderer;

    /**
     * The graphics instance.
     */
    private _graphics?: Viva.Graph.View.IWebGLGraphics<IVisualizerVertex, unknown>;

    /**
     * The visualizer service.
     */
    private readonly _vizualizerService: VisualizerService;

    /**
     * Create a new instance of Visualizer.
     * @param props The props.
     */
    constructor(props: unknown) {
        super(props);

        this._graphElement = null;
        this._vizualizerService = ServiceFactory.get<VisualizerService>("visualizer");

        this.state = {
            dummy: true
        };
    }

    /**
     * The component will mount.
     */
    public componentDidMount(): void {
        super.componentDidMount();

        this._vizualizerService.subscribe(
            (vertex, op) => {
                if (op === "add" || op === "update") {
                    this.updateVertex(vertex);
                } else if (op === "delete") {
                    this.deleteVertex(vertex);
                }
            },
            counts => {
                // console.log(counts);
            },
            (referencedId, excludedIds, counts) => this.referenceVertex(referencedId, excludedIds, counts)
        );
    }

    /**
     * The component will unmount.
     */
    public componentWillUnmount(): void {
        super.componentWillUnmount();
        this._graph = undefined;
        this._graphics = undefined;
        this._renderer = undefined;
        this._graphElement = null;
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="visualizer">
                <div
                    className="graph"
                    ref={r => this.setupGraph(r)}
                >
                    <div className="card key-panel">
                        <div className="key-panel-item">
                            <div className="key-marker key-marker--solid" />
                            <div className="key-label">Solid</div>
                        </div>
                        <div className="key-panel-item">
                            <div className="key-marker key-marker--unsolid" />
                            <div className="key-label">Unsolid</div>
                        </div>
                        <div className="key-panel-item">
                            <div className="key-marker key-marker--referenced" />
                            <div className="key-label">Referenced</div>
                        </div>
                        <div className="key-panel-item">
                            <div className="key-marker key-marker--conflicting" />
                            <div className="key-label">Conflicting</div>
                        </div>
                        <div className="key-panel-item">
                            <div className="key-marker key-marker--milestone" />
                            <div className="key-label">Milestone</div>
                        </div>
                        <div className="key-panel-item">
                            <div className="key-marker key-marker--unknown" />
                            <div className="key-label">Unknown</div>
                        </div>
                        <div className="key-panel-item">
                            <div className="key-marker key-marker--tip" />
                            <div className="key-label">Tip</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Setup the graph.
     * @param graphElem The element to use.
     */
    private setupGraph(graphElem: HTMLElement | null): void {
        this._graphElement = graphElem;

        if (graphElem && !this._graph) {
            this._graph = Viva.Graph.graph();

            this._graphics = Viva.Graph.View.webglGraphics();

            const layout = Viva.Graph.Layout.forceDirected(this._graph, {
                springLength: 10,
                springCoeff: 0.0001,
                stableThreshold: 0.15,
                gravity: -2,
                dragCoeff: 0.02,
                timeStep: 20,
                theta: 0.8
            });

            this._graphics.node(node => Viva.Graph.View.webglSquare(
                this.calculateSize(node.data),
                `#${this.calculateColor(node.data).toString(16)}`
            ));

            this._graphics.link(() => Viva.Graph.View.webglLine(`#${Visualizer.COLOR_LINK.toString(16)}`));

            this._renderer = Viva.Graph.View.renderer(this._graph, {
                container: graphElem,
                graphics: this._graphics,
                layout,
                renderLinks: true
            });

            this._renderer.run();

            this._graphics.scale(1, { x: graphElem.clientWidth / 2, y: graphElem.clientHeight / 2 });

            for (let i = 0; i < 12; i++) {
                this._renderer.zoomOut();
            }
        }
    }

    /**
     * Draw a vertex.
     * @param vertex The vertex to draw.
     */
    private updateVertex(vertex: IVisualizerVertex): void {
        if (this._graph) {
            let node = this._graph.getNode(vertex.shortId);
            if (node) {
                this.updateNodeUI(vertex);
            } else {
                node = this._graph.addNode(vertex.shortId, vertex);
            }
            if (vertex.parent1Id &&
                (!node.links || !node.links.some(link => link.toId === vertex.parent1Id))) {
                this._graph.addLink(vertex.shortId, vertex.parent1Id);
            }
            if (vertex.parent2Id &&
                vertex.parent1Id !== vertex.parent2Id &&
                (!node.links || !node.links.some(link => link.toId === vertex.parent2Id))) {
                this._graph.addLink(vertex.shortId, vertex.parent2Id);
            }
        }
    }

    /**
     * Update node style.
     * @param vertex The nertex
     */
    private updateNodeUI(vertex: IVisualizerVertex): void {
        if (this._graphics) {
            const nodeUI = this._graphics.getNodeUI(vertex.shortId);
            if (nodeUI) {
                nodeUI.color = this.calculateColor(vertex);
                nodeUI.size = this.calculateSize(vertex);
            }
        }
    }

    /**
     * Calculate the color for the vertex.
     * @param vertex The vertex to calculate the color for.
     * @returns The color.
     */
    private calculateColor(vertex: IVisualizerVertex): number {
        if (!vertex || (!vertex.parent1Id && !vertex.parent2Id)) {
            return Visualizer.COLOR_UNKNOWN;
        }
        if (vertex.isSelected) {
            return Visualizer.COLOR_SELECTED;
        }
        if (vertex.isMilestone) {
            return Visualizer.COLOR_MILESTONE;
        }
        if (vertex.isTip) {
            return Visualizer.COLOR_TIP;
        }
        if (vertex.isConflicting) {
            return Visualizer.COLOR_CONFLICTING;
        }
        if (vertex.isReferenced) {
            return Visualizer.COLOR_REFERENCED;
        }
        if (vertex.isSolid) {
            return Visualizer.COLOR_SOLID;
        }
        return Visualizer.COLOR_UNSOLID;
    }

    /**
     * Calulate the size for the vertex.
     * @param vertex The vertex to calculate the size for.
     * @returns The size.
     */
    private calculateSize(vertex: IVisualizerVertex): number {
        if (!vertex || (!vertex.parent1Id && !vertex.parent2Id)) {
            return Visualizer.VERTEX_SIZE_SMALL;
        }
        if (vertex.isSelected) {
            return Visualizer.VERTEX_SIZE_LARGE;
        }
        if (vertex.isMilestone) {
            return Visualizer.VERTEX_SIZE_LARGE;
        }
        return Visualizer.VERTEX_SIZE_MEDIUM;
    }

    /**
     * Delete a vertex.
     * @param vertex The vertex to delete.
     */
    private deleteVertex(vertex: IVisualizerVertex): void {
        // Deselect if it is selected !!!!!!!!!!!!!!!!!!!!!!!!!!
        if (this._graph) {
            this._graph.removeNode(vertex.shortId);
        }
    }

    /**
     * Update the referenced information.
     * @param referencedId The vertex that has been referenced.
     * @param excludedIds Excluded ids.
     * @param counts The visualizer counts.
     */
    private referenceVertex(referencedId: string, excludedIds: string[], counts: IVisualizerCounts): void {
        if (this._graph) {
            const startNode = this._graph.getNode(referencedId);

            if (startNode) {
                const seenBackwards: Viva.Graph.INode<IVisualizerVertex, unknown>[] = [];
                this.dfsIterator(
                    startNode,
                    shortNodeId => {
                        if (this._graph) {
                            const parent = this._graph.getNode(shortNodeId);
                            if (!parent || !parent.data) {
                                return true;
                            }

                            if (!parent.data.isReferenced && !parent.data.isConflicting) {
                                if (excludedIds.includes(parent.data.shortId)) {
                                    counts.conflicting++;
                                    parent.data.isConflicting = true;
                                    this.updateVertex(parent.data);
                                    return false;
                                }

                                counts.referenced++;
                                parent.data.isReferenced = true;
                                this.updateVertex(parent.data);
                                return false;
                            }
                        }

                        return true;
                    },
                    false,
                    seenBackwards
                );
            }
        }
    }

    /**
     * Walk the graph.
     * @param startNode The node to start with.
     * @param iterator The iterator method to call on each node.
     * @param up Are we walking up or down.
     * @param seenNodes The nodes we have already seen.
     */
    private dfsIterator(
        startNode: Viva.Graph.INode<IVisualizerVertex, unknown>,
        iterator: (nodeId: string) => boolean,
        up: boolean,
        seenNodes: Viva.Graph.INode<IVisualizerVertex, unknown>[]): void {
        if (this._graph) {
            seenNodes.push(startNode);
            let pointer = 0;

            while (seenNodes.length > pointer) {
                const node = seenNodes[pointer++];

                if (iterator(node.data?.shortId || node.id.slice(0, 7))) {
                    continue;
                }

                for (const link of node.links) {
                    if (!up && link.fromId === node.data.shortId) {
                        const linkNode = this._graph.getNode(link.toId);
                        if (linkNode && !seenNodes.includes(linkNode)) {
                            seenNodes.push(linkNode);
                        }
                    }

                    if (up && link.toId === node.data.shortId) {
                        const linkNode = this._graph.getNode(link.fromId);
                        if (linkNode && !seenNodes.includes(linkNode)) {
                            seenNodes.push(linkNode);
                        }
                    }
                }
            }
        }
    }
}

export default Visualizer;
