import { INDEXATION_PAYLOAD_TYPE, MILESTONE_PAYLOAD_TYPE, SIG_LOCKED_SINGLE_OUTPUT_TYPE, TRANSACTION_PAYLOAD_TYPE, UnitsHelper } from "@iota/iota.js";
import classNames from "classnames";
import React, { ReactNode } from "react";
import { RouteComponentProps } from "react-router-dom";
import Viva from "vivagraphjs";
import { ReactComponent as CloseIcon } from "../../assets/close.svg";
import { ReactComponent as PauseIcon } from "../../assets/pause.svg";
import { ReactComponent as PlayIcon } from "../../assets/play.svg";
import { ServiceFactory } from "../../factories/serviceFactory";
import { IVisualizerCounts } from "../../models/visualizer/IVisualizerCounts";
import { IVisualizerVertex } from "../../models/visualizer/IVisualizerVertex";
import { IMpsMetrics } from "../../models/websocket/IMpsMetrics";
import { WebSocketTopic } from "../../models/websocket/webSocketTopic";
import { MetricsService } from "../../services/metricsService";
import { TangleService } from "../../services/tangleService";
import { ThemeService } from "../../services/themeService";
import { VisualizerService } from "../../services/visualizerService";
import { FormatHelper } from "../../utils/formatHelper";
import AsyncComponent from "../components/layout/AsyncComponent";
import "./Visualizer.scss";
import { VisualizerState } from "./VisualizerState";

/**
 * Visualizer panel.
 */
class Visualizer extends AsyncComponent<RouteComponentProps, VisualizerState> {
    /**
     * Map the vetex states to colors.
     */
    private static readonly STATE_COLOR_MAP: { [id: string]: number } = {
        Solid: 0x4CAAFFFF,
        Unsolid: 0x8FE6FAFF,
        Referenced: 0x61E884FF,
        Conflicting: 0xFF8B5CFF,
        Milestone: 0x666AF6FF,
        Tip: 0xFFCA62FF,
        Unknown: 0x9AADCEFF
    };

    /**
     * Color for connection between vertices.
     */
    private static readonly THEME_COLOR_LINKS: { [theme: string]: number } = {
        dark: 0xFFFFFF22,
        light: 0xDDDDDDFF
    };

    private static readonly COLOR_LINK_CHILDREN = 0xFF5AAAFF;

    private static readonly COLOR_LINK_PARENTS = 0x0000FFFF;

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
     * The metrics service.
     */
    private readonly _metricsService: MetricsService;

    /**
     * The tangle service.
     */
    private readonly _tangleService: TangleService;

    /**
     * The theme service.
     */
    private readonly _themeService: ThemeService;

    /**
     * The mps metrics subscription id.
     */
    private _mpsMetricsSubscription?: string;

    /**
     * The theme subscription id.
     */
    private _themeSubscriptionId?: string;

    /**
     * The resize method
     */
    private readonly _resize: () => void;

    /**
     * Entered vertex.
     */
    private _enteredVertexId?: string;

    /**
     * Create a new instance of Visualizer.
     * @param props The props.
     */
    constructor(props: RouteComponentProps) {
        super(props);

        this._graphElement = null;
        this._resize = () => this.resize();
        this._vizualizerService = ServiceFactory.get<VisualizerService>("visualizer");
        this._metricsService = ServiceFactory.get<MetricsService>("metrics");
        this._tangleService = ServiceFactory.get<TangleService>("tangle");
        this._themeService = ServiceFactory.get<ThemeService>("theme");

        this.state = {
            mps: "-",
            total: "-",
            tips: "-",
            referenced: "-",
            conflicting: "-",
            solid: "-",
            isActive: true,
            theme: this._themeService.get()
        };
    }

    /**
     * The component will mount.
     */
    public componentDidMount(): void {
        super.componentDidMount();

        window.addEventListener("resize", this._resize);

        this._vizualizerService.subscribe(
            (vertex, op) => {
                if (op === "add" || op === "update") {
                    this.updateVertex(vertex);
                } else if (op === "delete") {
                    this.deleteVertex(vertex);
                }
            },
            counts => {
                if (this.state.isActive) {
                    this.setState({
                        total: counts.total.toString(),
                        tips: counts.tips.toString(),
                        referenced: counts.total > 0
                            ? `${(counts.referenced / counts.total * 100).toFixed(2)}%`
                            : "-",
                        conflicting: counts.total > 0
                            ? `${(counts.conflicting / counts.total * 100).toFixed(2)}%`
                            : "-",
                        solid: counts.total > 0 ? `${(counts.solid / counts.total * 100).toFixed(2)}%` : "-"
                    });
                }
            },
            (referencedId, excludedIds, counts) => this.referenceVertex(referencedId, excludedIds, counts)
        );

        this._mpsMetricsSubscription = this._metricsService.subscribe<IMpsMetrics>(
            WebSocketTopic.MPSMetrics, data => {
                if (data && this.state.isActive) {
                    this.setState({ mps: data.new.toString() });
                }
            });

        this._themeSubscriptionId = this._themeService.subscribe(() => {
            this.setState({ theme: this._themeService.get() }, () => this.styleAllLinks());
        });
    }

    /**
     * The component will unmount.
     */
    public componentWillUnmount(): void {
        super.componentWillUnmount();

        if (this._mpsMetricsSubscription) {
            this._metricsService.unsubscribe(this._mpsMetricsSubscription);
            this._mpsMetricsSubscription = undefined;
        }

        if (this._themeSubscriptionId) {
            this._themeService.unsubscribe(this._themeSubscriptionId);
            this._themeSubscriptionId = undefined;
        }

        this._graph = undefined;
        this._graphics = undefined;
        this._renderer = undefined;
        this._graphElement = null;
        window.removeEventListener("resize", this._resize);
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="visualizer">
                <div
                    className="canvas"
                    ref={r => this.setupGraph(r)}
                />
                <div className="action-panel-container">
                    <div className="card padding-0">
                        <button
                            className="icon-button"
                            type="button"
                            onClick={() => this.toggleActivity()}
                        >
                            {this.state.isActive ? <PauseIcon /> : <PlayIcon />}
                        </button>
                    </div>
                </div>
                <div className="stats-panel-container">
                    <div className="card stats-panel">
                        <div className="card--label">
                            Messages
                        </div>
                        <div className="card--value">
                            {this.state.total}
                        </div>
                        <div className="card--label">
                            MPS
                        </div>
                        <div className="card--value">
                            {this.state.mps}
                        </div>
                        <div className="card--label">
                            Tips
                        </div>
                        <div className="card--value">
                            {this.state.tips}
                        </div>
                        <div className="card--label">
                            Referenced
                        </div>
                        <div className="card--value">
                            {this.state.referenced}
                        </div>
                        <div className="card--label">
                            Conflicting
                        </div>
                        <div className="card--value">
                            {this.state.conflicting}
                        </div>
                        <div className="card--label">
                            Solid
                        </div>
                        <div className="card--value">
                            {this.state.solid}
                        </div>
                    </div>
                </div>
                <div className="key-panel-container">
                    <div className="card key-panel">
                        <div className="key-panel-item">
                            <div className="key-marker vertex-state--solid" />
                            <div className="key-label">Solid</div>
                        </div>
                        <div className="key-panel-item">
                            <div className="key-marker vertex-state--unsolid" />
                            <div className="key-label">Unsolid</div>
                        </div>
                        <div className="key-panel-item">
                            <div className="key-marker vertex-state--referenced" />
                            <div className="key-label">Referenced</div>
                        </div>
                        <div className="key-panel-item">
                            <div className="key-marker vertex-state--conflicting" />
                            <div className="key-label">Conflicting</div>
                        </div>
                        <div className="key-panel-item">
                            <div className="key-marker vertex-state--milestone" />
                            <div className="key-label">Milestone</div>
                        </div>
                        <div className="key-panel-item">
                            <div className="key-marker vertex-state--unknown" />
                            <div className="key-label">Unknown</div>
                        </div>
                        <div className="key-panel-item">
                            <div className="key-marker vertex-state--tip" />
                            <div className="key-label">Tip</div>
                        </div>
                    </div>
                </div>
                {this.state.selected && this._graphElement && (
                    <div
                        className="info-panel-container"
                    >
                        <div className="card fill padding-m">
                            <div className="row middle spread">
                                <div className="row middle">
                                    <div className={
                                        classNames(
                                            "info-panel--key",
                                            `vertex-state--${this.state.selected.state.toLowerCase()}`
                                        )
                                    }
                                    />
                                    <h3>{this.state.selected.state}{this.state.selected.title}</h3>
                                </div>
                                <button
                                    type="button"
                                    className="icon-button"
                                    onClick={() => this.selectNode()}
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                            <div className="col">
                                {this.state.selected.vertex.fullId && (
                                    <React.Fragment>
                                        <div className="card--label">
                                            Message Id
                                        </div>
                                        <div className="card--value">
                                            <a
                                                href={this.calculateMessageLink(this.state.selected.vertex)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {this.state.selected.vertex.fullId}
                                            </a>
                                        </div>
                                    </React.Fragment>
                                )}
                                {this.state.selected.payload &&
                                    this.state.selected.payload.type === TRANSACTION_PAYLOAD_TYPE && (
                                        <React.Fragment>
                                            <div className="card--label">
                                                Total
                                            </div>
                                            <div className="card--value">
                                                {UnitsHelper.formatBest(this.calculateTotal())}
                                            </div>
                                        </React.Fragment>
                                    )}
                                {this.state.selected.payload &&
                                    this.state.selected.payload.type === MILESTONE_PAYLOAD_TYPE && (
                                        <React.Fragment>
                                            <div className="card--label">
                                                Index
                                            </div>
                                            <div className="card--value">
                                                {this.state.selected.payload.index}
                                            </div>
                                            <div className="card--label">
                                                Date
                                            </div>
                                            <div className="card--value">
                                                {FormatHelper.date(this.state.selected.payload.timestamp, false)}
                                            </div>
                                        </React.Fragment>
                                    )}
                                {this.state.selected.payload &&
                                    this.state.selected.payload.type === INDEXATION_PAYLOAD_TYPE && (
                                        <React.Fragment>
                                            <div className="card--label">
                                                Index
                                            </div>
                                            <div className="card--value">
                                                {this.state.selected.payload.index}
                                            </div>
                                        </React.Fragment>
                                    )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    /**
     * Setup the graph.
     * @param graphElement The element to use.
     */
    private setupGraph(graphElement: HTMLElement | null): void {
        this._graphElement = graphElement;

        if (graphElement && !this._graph) {
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
                `#${Visualizer.STATE_COLOR_MAP[this.calculateState(node.data)].toString(16)}`
            ));

            this._graphics.link(() => Viva.Graph.View.webglLine(
                `#${Visualizer.THEME_COLOR_LINKS[this.state.theme].toString(16)}`));

            this._renderer = Viva.Graph.View.renderer(this._graph, {
                container: graphElement,
                graphics: this._graphics,
                layout,
                renderLinks: true
            });

            const events = Viva.Graph.webglInputEvents(this._graphics, this._graph);

            events.click(node => this.selectNode(node));
            events.dblClick(node => {
                this.selectNode();
                window.open(
                    this.calculateMessageLink(node.data),
                    "_blank"
                );
            });

            events.mouseEnter(node => {
                if (!this.state.selected) {
                    if (this._enteredVertexId) {
                        this.connectedLinkStyle(this._enteredVertexId, false);
                        this._enteredVertexId = undefined;
                    }
                    if (node) {
                        this._enteredVertexId = node.data?.shortId ?? node.id.slice(0, 7);
                        this.connectedLinkStyle(this._enteredVertexId, true);
                    }
                }
            });

            events.mouseLeave(node => {
                if (this._enteredVertexId) {
                    this.connectedLinkStyle(this._enteredVertexId, false);
                    this._enteredVertexId = undefined;
                }
            });

            this._renderer.run();

            this._graphics.scale(1, { x: graphElement.clientWidth / 2, y: graphElement.clientHeight / 2 });

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
            let node = this.updateNodeUI(vertex.shortId);
            if (!node) {
                node = this._graph.addNode(vertex.shortId, vertex);
            }
            if (vertex.parents) {
                const added: string[] = [];
                for (let i = 0; i < vertex.parents.length; i++) {
                    const parent = vertex.parents[i];
                    if (!added.includes(parent) &&
                        (!node.links || !node.links.some(link => link.toId === parent))) {
                        added.push(parent);
                        this._graph.addLink(vertex.shortId, parent);
                    }
                }
            }
        }
    }

    /**
     * Update node style.
     * @param id The node id.
     * @returns The updated node.
     */
    private updateNodeUI(id: string): Viva.Graph.INode<IVisualizerVertex, unknown> | undefined {
        if (this._graphics && this._graph) {
            const node = this._graph?.getNode(id);

            if (node) {
                const nodeUI = this._graphics.getNodeUI(id);
                if (nodeUI) {
                    nodeUI.color = Visualizer.STATE_COLOR_MAP[this.calculateState(node.data)];
                    nodeUI.size = this.calculateSize(node.data);
                }
            }

            return node;
        }
    }

    /**
     * Calculate the state for the vertex.
     * @param vertex The vertex to calculate the state for.
     * @returns The state.
     */
    private calculateState(vertex?: IVisualizerVertex): string {
        if (!vertex || !vertex.parents) {
            return "Unknown";
        }
        if (vertex.isMilestone) {
            return "Milestone";
        }
        if (vertex.isTip) {
            return "Tip";
        }
        if (vertex.isConflicting) {
            return "Conflicting";
        }
        if (vertex.isReferenced) {
            return "Referenced";
        }
        if (vertex.isSolid) {
            return "Solid";
        }
        return "Unsolid";
    }

    /**
     * Calulate the size for the vertex.
     * @param vertex The vertex to calculate the size for.
     * @returns The size.
     */
    private calculateSize(vertex?: IVisualizerVertex): number {
        if (!vertex || !vertex.parents) {
            return 10;
        }
        if (vertex.isSelected || vertex.isMilestone) {
            return 30;
        }
        return 20;
    }

    /**
     * Delete a vertex.
     * @param vertex The vertex to delete.
     */
    private deleteVertex(vertex: IVisualizerVertex): void {
        if (this._graph) {
            this._graph.removeNode(vertex.shortId);

            if (this.state.selected &&
                this.state.selected.vertex.shortId === vertex.shortId) {
                this.setState({ selected: undefined });
                this.connectedLinkStyle(this.state.selected.vertex.shortId, false);
            }

            if (this._enteredVertexId &&
                this._enteredVertexId === vertex.shortId) {
                this.connectedLinkStyle(this._enteredVertexId, false);
                this._enteredVertexId = undefined;
            }
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
                    nodeId => {
                        if (this._graph) {
                            const parent = this._graph.getNode(nodeId);
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
                    undefined,
                    false,
                    seenBackwards
                );
            }
        }
    }

    /**
     * Walk the graph.
     * @param startNode The node to start with.
     * @param nodeCallback The iterator method to call on each node.
     * @param linkCallback The iterator method to call on each link.
     * @param up Are we walking up or down.
     * @param seenNodes The nodes we have already seen.
     */
    private dfsIterator(
        startNode: Viva.Graph.INode<IVisualizerVertex, unknown>,
        nodeCallback: ((nodeId: string) => boolean) | undefined,
        linkCallback: ((linkId: string) => void) | undefined,
        up: boolean,
        seenNodes: Viva.Graph.INode<IVisualizerVertex, unknown>[]): void {
        if (this._graph) {
            seenNodes.push(startNode);
            let pointer = 0;

            while (seenNodes.length > pointer) {
                const node = seenNodes[pointer++];
                const nodeId = node.data?.shortId ?? node.id.slice(0, 7);

                if (nodeCallback?.(nodeId)) {
                    continue;
                }

                for (const link of node.links) {
                    if (!up && link.fromId === nodeId) {
                        if (linkCallback) {
                            linkCallback(link.id);
                        }
                        const linkNode = this._graph.getNode(link.toId);
                        if (linkNode && !seenNodes.includes(linkNode)) {
                            seenNodes.push(linkNode);
                        }
                    }

                    if (up && link.toId === nodeId) {
                        if (linkCallback) {
                            linkCallback(link.id);
                        }
                        const linkNode = this._graph.getNode(link.fromId);
                        if (linkNode && !seenNodes.includes(linkNode)) {
                            seenNodes.push(linkNode);
                        }
                    }
                }
            }
        }
    }

    /**
     * The window was resized.
     */
    private resize(): void {
        if (this._graphics && this._graphElement) {
            this._graphics.updateSize();
            this._graphics.scale(1, {
                x: this._graphElement.clientWidth / 2,
                y: this._graphElement.clientHeight / 2
            });
        }
    }

    /**
     * Toggle if the visualizer is active.
     */
    private toggleActivity(): void {
        if (this._renderer) {
            if (this.state.isActive) {
                this._renderer.pause();
            } else {
                this._renderer.resume();
            }
        }

        this.setState({ isActive: !this.state.isActive });
    }

    /**
     * Select a node.
     * @param node The node to select
     */
    private selectNode(node?: Viva.Graph.INode<IVisualizerVertex, unknown>): void {
        if (this.state.selected) {
            this.state.selected.vertex.isSelected = false;
            this.updateNodeUI(this.state.selected.vertex.shortId);
            this.connectedLinkStyle(this.state.selected.vertex.shortId, false);
        }

        if (node) {
            if (!node.data) {
                node.data = {
                    shortId: node.id
                };
            }
            node.data.isSelected = true;
            this.updateNodeUI(node.id);

            if (this._enteredVertexId) {
                this.connectedLinkStyle(this._enteredVertexId, false);
                this._enteredVertexId = undefined;
            }
            this.connectedLinkStyle(node.data.shortId, true);

            this.setState({
                selected: {
                    vertex: node?.data,
                    state: this.calculateState(node.data)
                }
            },
                async () => {
                    if (node.data?.fullId) {
                        const payload = await this._tangleService.payload(node.data.fullId);
                        let payloadTitle = "";

                        if (payload) {
                            if (payload.type === TRANSACTION_PAYLOAD_TYPE) {
                                payloadTitle = " - Transaction";
                            } else if (payload.type === MILESTONE_PAYLOAD_TYPE) {
                                payloadTitle = "";
                            } else if (payload.type === INDEXATION_PAYLOAD_TYPE) {
                                payloadTitle = " - Indexation";
                            }
                        } else if (node.data.isMilestone) {
                            payloadTitle = " - Checkpoint";
                        }

                        this.setState({
                            selected: {
                                vertex: node?.data,
                                state: this.calculateState(node.data),
                                payload,
                                title: payloadTitle
                            }
                        });
                    }
                });
        } else {
            this.setState({ selected: undefined });
        }
    }

    /**
     * Calculate the link for the message.
     * @param vertex The vertex id.
     * @returns The url for the message.
     */
    private calculateMessageLink(vertex?: IVisualizerVertex): string {
        return vertex?.fullId
            ? `${window.location.protocol}//${window.location.host}/explorer/message/${vertex.fullId}`
            : "";
    }

    /**
     * Highlight the forward and backwards cones.
     * @param vertexId The node to highlight.
     * @param highlight Highlight or clear the coloring.
     */
    private connectedLinkStyle(vertexId: string, highlight: boolean): void {
        if (this._graph) {
            const startNode = this._graph.getNode(vertexId);

            if (startNode) {
                const seenForward: Viva.Graph.INode<IVisualizerVertex, unknown>[] = [];
                const seenBackwards: Viva.Graph.INode<IVisualizerVertex, unknown>[] = [];

                this.dfsIterator(
                    startNode,
                    undefined,
                    linkId => {
                        if (this._graphics) {
                            const linkUI = this._graphics.getLinkUI(linkId);
                            if (linkUI) {
                                linkUI.color = highlight
                                    ? Visualizer.COLOR_LINK_CHILDREN : Visualizer.THEME_COLOR_LINKS[this.state.theme];
                            }
                        }
                    },
                    true,
                    seenBackwards
                );
                this.dfsIterator(
                    startNode,
                    undefined,
                    linkId => {
                        if (this._graphics) {
                            const linkUI = this._graphics.getLinkUI(linkId);
                            if (linkUI) {
                                linkUI.color = highlight
                                    ? Visualizer.COLOR_LINK_PARENTS : Visualizer.THEME_COLOR_LINKS[this.state.theme];
                            }
                        }
                    },
                    false,
                    seenForward
                );
            }
        }
    }

    /**
     * Style all the links.
     */
    private styleAllLinks(): void {
        if (this._graph && this._graphics) {
            this._graph.forEachLink(link => {
                if (this._graphics) {
                    const linkUI = this._graphics.getLinkUI(link.id);
                    if (linkUI) {
                        linkUI.color = Visualizer.THEME_COLOR_LINKS[this.state.theme];
                    }
                }
            });
        }
    }

    /**
     * Calculate the total of outputs for a transaction payload.
     * @returns The total.
     */
    private calculateTotal(): number {
        let total = 0;

        if (this.state.selected?.payload?.type === TRANSACTION_PAYLOAD_TYPE) {
            for (const output of this.state.selected.payload.essence.outputs) {
                if (output.type === SIG_LOCKED_SINGLE_OUTPUT_TYPE) {
                    total += output.amount;
                }
            }
        }

        return total;
    }
}

export default Visualizer;
