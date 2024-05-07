import { Converter } from "@iota/util.js";
import classNames from "classnames";
import React, { ReactNode } from "react";
import { RouteComponentProps } from "react-router-dom";
import Viva from "vivagraphjs";
import { ReactComponent as CloseIcon } from "../../assets/close.svg";
import { ReactComponent as PauseIcon } from "../../assets/pause.svg";
import { ReactComponent as PlayIcon } from "../../assets/play.svg";
import { ServiceFactory } from "../../factories/serviceFactory";
import { BLOCK_BODY_TYPE_BASIC, BLOCK_BODY_TYPE_VALIDATION } from "../../models/tangle/blockBodyTypes";
import { PAYLOAD_TYPE_CANDIDACY_ANNOUNCEMENT, PAYLOAD_TYPE_SIGNED_TRANSACTION, PAYLOAD_TYPE_TAGGED_DATA } from "../../models/tangle/payloadTypes";
import { IVertex } from "../../models/visualizer/IVertex";
import { IGossipMetrics } from "../../models/websocket/IGossipMetrics";
import { WebSocketTopic } from "../../models/websocket/webSocketTopic";
import { DashboardConfigService } from "../../services/dashboardConfigService";
import { EventAggregator } from "../../services/eventAggregator";
import { MetricsService } from "../../services/metricsService";
import { TangleService } from "../../services/tangleService";
import { ThemeService } from "../../services/themeService";
import { VisualizerService } from "../../services/visualizerService";
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
        unknown: 0x9AADCEFF,
        pending: 0xEC9A1EFF,
        accepted: 0xF5F24FFF,
        confirmed: 0x5CFAFFFF,
        finalized: 0x61E884FF,
        transaction: 0xC061E8FF,
        validation: 0x2260E7FF,
        tip: 0xD92121FF
    };

    private static readonly BLOCK_STATE_TITLE_MAP: { [id: string]: string } = {
        unknown: "Unknown",
        pending: "Pending",
        accepted: "Accepted",
        confirmed: "Confirmed",
        finalized: "Finalized"
    };

    /**
     * Color for connection between vertices.
     */
    private static readonly THEME_COLOR_LINKS: { [theme: string]: number } = {
        dark: 0xFFFFFF22,
        light: 0xDDDDDDFF
    };

    /**
     * Children link color.
     */
    private static readonly COLOR_LINK_CHILDREN = 0xFF5AAAFF;

    /**
     * Parent link color.
     */
    private static readonly COLOR_LINK_PARENTS = 0x0000FFFF;

    /**
     * The graph element.
     */
    private _graphElement: HTMLElement | null;

    /**
     * The graph instance.
     */
    private _graph?: Viva.Graph.IGraph<IVertex, unknown>;

    /**
     * The renderer instance.
     */
    private _renderer?: Viva.Graph.View.IRenderer;

    /**
     * The graphics instance.
     */
    private _graphics?: Viva.Graph.View.IWebGLGraphics<IVertex, unknown>;

    /**
     * The visualizer service.
     */
    private readonly _vizualizerService: VisualizerService;

    /**
     * The dashboard config service.
     */
    private readonly _dashboardConfigService: DashboardConfigService;

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
     * The gossip metrics subscription id.
     */
    private _gossipMetricsSubscription?: string;

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
        this._dashboardConfigService = ServiceFactory.get<DashboardConfigService>("dashboard-config");
        this._metricsService = ServiceFactory.get<MetricsService>("metrics");
        this._tangleService = ServiceFactory.get<TangleService>("tangle");
        this._themeService = ServiceFactory.get<ThemeService>("theme");

        this.state = {
            bps: "-",
            total: "-",
            tips: "-",
            accepted: "-",
            confirmed: "-",
            finalized: "-",
            transactions: "-",
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
                        accepted: counts.total > 0
                            ? `${(counts.accepted / counts.total * 100).toFixed(2)}%`
                            : "-",
                        confirmed: counts.total > 0
                            ? `${(counts.confirmed / counts.total * 100).toFixed(2)}%`
                            : "-",
                        finalized: counts.total > 0
                            ? `${(counts.finalized / counts.total * 100).toFixed(2)}%`
                            : "-",
                        transactions: counts.total > 0
                            ? `${(counts.transactions / counts.total * 100).toFixed(2)}%`
                            : "-"
                    });
                }
            }
        );

        this._gossipMetricsSubscription = this._metricsService.subscribe<IGossipMetrics>(
            WebSocketTopic.GossipMetrics, data => {
                if (data && this.state.isActive) {
                    this.setState({ bps: data.new.toString() });
                }
            });

        EventAggregator.subscribe("theme", "visualizer", theme => {
            this.setState({
                theme
            }, () => this.styleAllLinks());
        });
    }

    /**
     * The component will unmount.
     */
    public componentWillUnmount(): void {
        super.componentWillUnmount();

        if (this._gossipMetricsSubscription) {
            this._metricsService.unsubscribe(this._gossipMetricsSubscription);
            this._gossipMetricsSubscription = undefined;
        }

        this._vizualizerService.unsubscribe();

        EventAggregator.unsubscribe("theme", "visualizer");

        // This is a workaround for an issue in Safari
        // https://github.com/WebKit/WebKit/pull/1693
        // https://pqina.nl/blog/total-canvas-memory-use-exceeds-the-maximum-limit/
        if (this._graphElement) {
            const canvas = this._graphElement.children[0] as HTMLCanvasElement;
            canvas.width = 1;
            canvas.height = 1;
            const ctx = canvas.getContext("2d");
            ctx?.clearRect(0, 0, 1, 1);
        }

        this._graph?.clear();
        this._renderer?.dispose();

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
                            Blocks
                        </div>
                        <div className="card--value">
                            {this.state.total}
                        </div>
                        <div className="card--label">
                            BPS
                        </div>
                        <div className="card--value">
                            {this.state.bps}
                        </div>
                        <div className="card--label">
                            Tips
                        </div>
                        <div className="card--value">
                            {this.state.tips}
                        </div>
                        <div className="card--label">
                            Accepted
                        </div>
                        <div className="card--value">
                            {this.state.accepted}
                        </div>
                        <div className="card--label">
                            Confirmed
                        </div>
                        <div className="card--value">
                            {this.state.confirmed}
                        </div>
                        <div className="card--label">
                            Finalized
                        </div>
                        <div className="card--value">
                            {this.state.finalized}
                        </div>
                        <div className="card--label">
                            Transactions
                        </div>
                        <div className="card--value">
                            {this.state.transactions}
                        </div>
                    </div>
                </div>
                <div className="key-panel-container">
                    <div className="card key-panel">
                        <div className="key-panel-item">
                            <div className="key-marker vertex-state--pending" />
                            <div className="key-label">Pending</div>
                        </div>
                        <div className="key-panel-item">
                            <div className="key-marker vertex-state--accepted" />
                            <div className="key-label">Accepted</div>
                        </div>
                        <div className="key-panel-item">
                            <div className="key-marker vertex-state--confirmed" />
                            <div className="key-label">Confirmed</div>
                        </div>
                        <div className="key-panel-item">
                            <div className="key-marker vertex-state--finalized" />
                            <div className="key-label">Finalized</div>
                        </div>
                        <div className="key-panel-item">
                            <div className="key-marker vertex-state--transaction" />
                            <div className="key-label">Transaction</div>
                        </div>
                        <div className="key-panel-item">
                            <div className="key-marker vertex-state--validation" />
                            <div className="key-label">Validation</div>
                        </div>
                        <div className="key-panel-item">
                            <div className="key-marker vertex-state--tip" />
                            <div className="key-label">Tip</div>
                        </div>
                        <div className="key-panel-item">
                            <div className="key-marker vertex-state--unknown" />
                            <div className="key-label">Unknown</div>
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
                                            `vertex-state--${this.state.selected.vertexState}`
                                        )
                                    }
                                    />
                                    <h3>{this.state.selected.blockStateTitle}{this.state.selected.payloadTitle}</h3>
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
                                            Block Id
                                        </div>
                                        <div className="card--value">
                                            {
                                                this.calculateBlockLink(this.state.selected.vertex) === ""
                                                    ? <div>{this.state.selected.vertex.fullId}</div>
                                                    :
                                                    <a
                                                        href={this.calculateBlockLink(this.state.selected.vertex)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {this.state.selected.vertex.fullId}
                                                    </a>
                                            }
                                        </div>
                                    </React.Fragment>
                                )}
                                {this.state.selected.block?.body?.type === BLOCK_BODY_TYPE_BASIC &&
                                    this.state.selected.block.body.payload?.type === PAYLOAD_TYPE_TAGGED_DATA && (
                                        <React.Fragment>
                                            <div className="card--label">
                                                Tag UTF8
                                            </div>
                                            <div className="card--value">
                                                {Converter.hexToUtf8(this.state.selected.block?.body.payload.tag)}
                                            </div>
                                            <div className="card--label">
                                                Tag Hex
                                            </div>
                                            <div className="card--value">
                                                {this.state.selected.block?.body.payload.tag}
                                            </div>
                                        </React.Fragment>
                                    )}
                                {this.state.selected.block?.body?.type === BLOCK_BODY_TYPE_BASIC &&
                                    this.state.selected.block.body.payload?.type === PAYLOAD_TYPE_SIGNED_TRANSACTION && (
                                        <div />
                                    )}
                                {this.state.selected.block?.body?.type === BLOCK_BODY_TYPE_BASIC &&
                                    this.state.selected.block.body.payload?.type === PAYLOAD_TYPE_CANDIDACY_ANNOUNCEMENT && (
                                        <React.Fragment>
                                            <div className="card--label">
                                                Candidate
                                            </div>
                                            <div className="card--value">
                                                {this.state.selected.block?.header.issuerId}
                                            </div>
                                        </React.Fragment>
                                    )}

                                {this.state.selected.block?.body?.type === BLOCK_BODY_TYPE_VALIDATION &&
                                    <React.Fragment>
                                        <div className="card--label">
                                            Validator
                                        </div>
                                        <div className="card--value">
                                            {this.state.selected.block?.header.issuerId}
                                        </div>
                                        <div className="card--label">
                                            Highest Supported Version
                                        </div>
                                        <div className="card--value">
                                            {this.state.selected.block?.body.highestSupportedVersion}
                                        </div>
                                        <div className="card--label">
                                            Protocol Parameters Hash
                                        </div>
                                        <div className="card--value">
                                            {this.state.selected.block?.body.protocolParametersHash}
                                        </div>
                                    </React.Fragment>}
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
                `#${Visualizer.STATE_COLOR_MAP[this.calculateVertexState(node.data)].toString(16)}`
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
                    this.calculateBlockLink(node.data),
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
                        this._enteredVertexId = node.data?.shortId ?? node.id.slice(0, 10);
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
    private updateVertex(vertex: IVertex): void {
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
                        (!node.links?.some(link => link.toId === parent))) {
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
    private updateNodeUI(id: string): Viva.Graph.INode<IVertex, unknown> | undefined {
        if (this._graphics && this._graph) {
            const node = this._graph?.getNode(id);

            if (node) {
                const nodeUI = this._graphics.getNodeUI(id);
                if (nodeUI) {
                    nodeUI.color = Visualizer.STATE_COLOR_MAP[this.calculateVertexState(node.data)];
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
    private calculateVertexState(vertex?: IVertex): string {
        if (!vertex?.parents) {
            return "unknown";
        }

        if (vertex.isTip) {
            return "tip";
        }

        if (vertex.isFinalized) {
            if (vertex.isValidationBlock) {
                return "validation";
            }

            if (vertex.isBasicBlockSignedTransaction) {
                return "transaction";
            }

            return "finalized";
        }

        if (vertex.isConfirmed) {
            return "confirmed";
        }

        if (vertex.isAccepted) {
            return "accepted";
        }

        return "pending";
    }

    /**
     * Calculate the state for the block.
     * @param vertex The vertex to calculate the state for.
     * @returns The block state.
     */
    private calculateBlockState(vertex?: IVertex): string {
        if (!vertex?.parents) {
            return "unknown";
        }

        if (vertex.isFinalized) {
            return "finalized";
        }

        if (vertex.isConfirmed) {
            return "confirmed";
        }

        if (vertex.isAccepted) {
            return "accepted";
        }

        return "pending";
    }

    /**
     * Calulate the size for the vertex.
     * @param vertex The vertex to calculate the size for.
     * @returns The size.
     */
    private calculateSize(vertex?: IVertex): number {
        if (!vertex?.parents) {
            return 10;
        }
        if (vertex.isSelected) {
            return 30;
        }
        return 20;
    }

    /**
     * Delete a vertex.
     * @param vertex The vertex to delete.
     */
    private deleteVertex(vertex: IVertex): void {
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
     * Walk the graph.
     * @param startNode The node to start with.
     * @param nodeCallback The iterator method to call on each node.
     * @param linkCallback The iterator method to call on each link.
     * @param up Are we walking up or down.
     * @param seenNodes The nodes we have already seen.
     */
    private dfsIterator(
        startNode: Viva.Graph.INode<IVertex, unknown>,
        nodeCallback: ((nodeId: string) => boolean) | undefined,
        linkCallback: ((linkId: string) => void) | undefined,
        up: boolean,
        seenNodes: Viva.Graph.INode<IVertex, unknown>[]): void {
        if (this._graph) {
            seenNodes.push(startNode);
            let pointer = 0;

            while (seenNodes.length > pointer) {
                const node = seenNodes[pointer++];
                const nodeId = node.data?.shortId ?? node.id.slice(0, 10);

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
    private selectNode(node?: Viva.Graph.INode<IVertex, unknown>): void {
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
                    vertexState: this.calculateVertexState(node.data),
                    blockStateTitle: Visualizer.BLOCK_STATE_TITLE_MAP[this.calculateBlockState(node.data)]
                }
            },
                async () => {
                    if (node.data?.fullId) {
                        const block = await this._tangleService.block(node.data.fullId);
                        let payloadTitle = " - Unknown";

                        if (block?.body) {
                            switch (block?.body.type) {
                                case BLOCK_BODY_TYPE_BASIC:
                                    switch (block?.body.payload?.type) {
                                        case PAYLOAD_TYPE_TAGGED_DATA:
                                            payloadTitle = " - Tagged data";
                                            break;
                                        case PAYLOAD_TYPE_SIGNED_TRANSACTION:
                                            payloadTitle = " - Signed transaction";
                                            break;
                                        case PAYLOAD_TYPE_CANDIDACY_ANNOUNCEMENT:
                                            payloadTitle = " - Candidacy announcement";
                                            break;
                                        default:
                                            break;
                                    }
                                    break;
                                case BLOCK_BODY_TYPE_VALIDATION:
                                    payloadTitle = " - Validation block";
                                    break;
                                default:
                                    break;
                            }
                        }

                        this.setState({
                            selected: {
                                vertex: node?.data,
                                vertexState: this.calculateVertexState(node.data),
                                blockStateTitle: Visualizer.BLOCK_STATE_TITLE_MAP[this.calculateBlockState(node.data)],
                                block,
                                payloadTitle
                            }
                        });
                    }
                });
        } else {
            this.setState({ selected: undefined });
        }
    }

    /**
     * Calculate the link for the block.
     * @param vertex The vertex id.
     * @returns The url for the block.
     */
    private calculateBlockLink(vertex?: IVertex): string {
        const explorerURL = this._dashboardConfigService.getExplorerURL();
        if (explorerURL === "" || !vertex?.fullId) {
            return "";
        }

        return `${explorerURL}/block/${vertex.fullId}`;
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
                const seenForward: Viva.Graph.INode<IVertex, unknown>[] = [];
                const seenBackwards: Viva.Graph.INode<IVertex, unknown>[] = [];

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
}

export default Visualizer;
