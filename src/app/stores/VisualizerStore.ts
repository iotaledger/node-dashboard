import {action, observable, ObservableMap} from 'mobx';
import {registerHandler, WSMsgType} from "app/misc/WS";
import {RouterStore} from "mobx-react-router";
import {default as Viva} from 'vivagraphjs';

export class Vertex {
    id: string;
    parent1_id: string;
    parent2_id: string;
    is_solid: boolean;
    is_confirmed: boolean;
    is_conflicting: boolean;
    is_milestone: boolean;
    is_tip: boolean;
    is_selected: boolean;
}

export class MetaInfo {
    id: string;
}

export class ConfirmationInfo {
    id: string;
    excluded_ids: string[];
}

export class TipInfo {
    id: string;
    is_tip: boolean;
}

const vertexSizeSmall = 10;
const vertexSizeMedium = 20;
const vertexSizeBig = 30;
const idLength = 7;

// Solarized color palette
export const colorSolid = "#268bd2";
export const colorUnsolid = "#657b83";
export const colorConfirmed = "#5ce000";
export const colorConflicting = "#d17300";
export const colorMilestone = "#dc322f";
export const colorTip = "#00d1a4";
export const colorUnknown = "#b58900";
export const colorSelected = "#fdf6e3";
export const colorLink = "#586e75";
export const colorLinkChildren = "#ff5aaa";
export const colorLinkParents = "#ffc306";

export class VisualizerStore {
    vertices = new ObservableMap<string, Vertex>();
    @observable verticesLimit = 5000;
    solid_count = 0;
    confirmed_count = 0;
    conflicting_count = 0;
    tips_count = 0;
    verticesIncomingOrder = [];
    @observable collect: boolean = false;
    routerStore: RouterStore;

    // the currently selected vertex via hover
    @observable selected: Vertex;
    selected_children_count = 0;
    selected_parents_count = 0;
    selected_via_click: boolean = false;

    // viva graph objs
    graph;
    graphics;
    renderer;
    @observable paused: boolean = false;

    constructor(routerStore: RouterStore) {
        this.routerStore = routerStore;

        this.registerHandlers()
    }

    registerHandlers = () => {
        registerHandler(WSMsgType.Vertex, this.addVertex);
        registerHandler(WSMsgType.SolidInfo, this.addSolidInfo);
        registerHandler(WSMsgType.ConfirmedInfo, this.addConfirmedInfo);
        registerHandler(WSMsgType.MilestoneInfo, this.addMilestoneInfo);
        registerHandler(WSMsgType.TipInfo, this.addTipInfo);
    }

    @action
    pauseResume = () => {
        if (this.paused) {
            this.renderer.resume();
            this.paused = false;
            return;
        }
        this.renderer.pause();
        this.paused = true;
    }

    @action
    updateVerticesLimit = (num: number) => {
        this.verticesLimit = num;
    }

    @action
    addVertex = (vert: Vertex) => {
        if (!this.collect) return;

        vert.is_selected = false;

        let existing = this.vertices.get(vert.id.substring(0,idLength));
        if (existing) {
            // can only go from unsolid to solid
            if (!existing.is_solid && vert.is_solid) {
                existing.is_solid = true;
                this.solid_count++;
            }
            if (!existing.is_confirmed && vert.is_confirmed) {
                this.confirmed_count++;
            }
            if (!existing.is_conflicting && vert.is_conflicting) {
                this.conflicting_count++;
            }
            // update all infos since we might be dealing
            // with a vertex obj only created from missing parent1/parent2
            existing.id = vert.id;
            existing.parent1_id = vert.parent1_id;
            existing.parent2_id = vert.parent2_id;
            existing.is_solid = vert.is_solid;
            existing.is_confirmed = vert.is_confirmed;
            existing.is_conflicting = vert.is_conflicting;
            existing.is_milestone = vert.is_milestone;
            existing.is_tip = vert.is_tip;
            existing.is_selected = vert.is_selected;
            vert = existing
        } else {
            if (vert.is_solid) {
                this.solid_count++;
            }
            if (vert.is_confirmed) {
                this.confirmed_count++;
            }
            if (vert.is_conflicting) {
                this.conflicting_count++;
            }
            this.verticesIncomingOrder.push(vert.id.substring(0,idLength));
            this.checkLimit();
        }

        this.vertices.set(vert.id.substring(0,idLength), vert);
        this.drawVertex(vert);
    };

    @action
    addSolidInfo = (solidInfo: MetaInfo) => {
        if (!this.collect) return;
        let vert = this.vertices.get(solidInfo.id);
        if (!vert) {
            return;
        }
        if (!vert.is_solid) {
            this.solid_count++;
        }
        vert.is_solid = true;
        this.updateNodeUI(vert);
    };

    @action
    addConfirmedInfo = (confInfo: ConfirmationInfo) => {
        if (!this.collect) return;

        let node = this.graph.getNode(confInfo.id);
        if (!node) return;

        // walk the past cone
        const seenBackwards = [];
        dfsIterator(
            this.graph,
            node,
            node => {
                let parent = this.vertices.get(node.id);
                if (!parent) return true;

                if (!parent.is_confirmed && !parent.is_conflicting) {
                    // check if message is excluded
                    if (confInfo.excluded_ids?.indexOf(parent.id.substring(0,idLength)) > -1) {
                        this.conflicting_count++;
                        parent.is_conflicting = true;
                        this.updateNodeUI(parent);
                        return false;
                    }

                    this.confirmed_count++;
                    parent.is_confirmed = true;
                    this.updateNodeUI(parent);
                    return false
                }

                // abort if node was confirmed or conflicting
                return true;
            },
            false,
            link => {},
            seenBackwards
        );
    };

    @action
    addMilestoneInfo = (msInfo: MetaInfo) => {
        if (!this.collect) return;
        let vert = this.vertices.get(msInfo.id);
        if (!vert) {
            return;
        }
        vert.is_milestone = true;
        this.updateNodeUI(vert);
    };

    @action
    addTipInfo = (tipInfo: TipInfo) => {
        if (!this.collect) return;
        let vert = this.vertices.get(tipInfo.id);
        if (!vert) {
            return;
        }
        this.tips_count += tipInfo.is_tip ? 1 : vert.is_tip ? -1 : 0;
        vert.is_tip = tipInfo.is_tip;
        this.updateNodeUI(vert);
    };

    @action
    checkLimit = () => {
        while (this.verticesIncomingOrder.length > this.verticesLimit) {
            let deleteId = this.verticesIncomingOrder.shift();
            let vert = this.vertices.get(deleteId);
            // make sure we remove any markings if the vertex gets deleted
            if (this.selected && deleteId === this.selected.id.substring(0,idLength)) {
                this.clearSelected();
            }
            this.vertices.delete(deleteId);
            this.graph.removeNode(deleteId);
            if (!vert) {
                continue;
            }
            if (vert.is_solid) {
                this.solid_count--;
            }
            if (vert.is_confirmed) {
                this.confirmed_count--;
            }
            if (vert.is_conflicting) {
                this.conflicting_count--;
            }
            if (vert.is_tip) {
                this.tips_count--;
            }
            this.deleteParentLink(vert.parent1_id);
            this.deleteParentLink(vert.parent2_id);
        }
    }

    @action
    deleteParentLink = (parentId: string) => {
        if (!parentId) {
            return;
        }
        let parent = this.vertices.get(parentId);
        if (parent) {
            if (this.selected && parentId === this.selected.id.substring(0,idLength)) {
                this.clearSelected();
            }
            if (parent.is_solid) {
                this.solid_count--;
            }
            if (parent.is_referenced) {
                this.referenced_count--;
            }
            if (parent.is_conflicting) {
                this.conflicting_count--;
            }
            if (parent.is_tip) {
                this.tips_count--;
            }
            this.vertices.delete(parentId);
        }
        this.graph.removeNode(parentId);
    }

    drawVertex = (vert: Vertex) => {
        let node;
        let existing = this.graph.getNode(vert.id.substring(0,idLength));
        if (existing) {
            // update coloring
            this.updateNodeUI(vert);
            node = existing
        } else {
            node = this.graph.addNode(vert.id.substring(0,idLength), vert);
        }
        if (vert.parent1_id && (!node.links || !node.links.some(link => link.toId === vert.parent1_id))) {
            this.graph.addLink(vert.id.substring(0,idLength), vert.parent1_id);
        }
        if (vert.parent1_id === vert.parent2_id) {
            return;
        }
        if (vert.parent2_id && (!node.links || !node.links.some(link => link.toId === vert.parent2_id))) {
            this.graph.addLink(vert.id.substring(0,idLength), vert.parent2_id);
        }
    }

    colorForVertexState = (vert: Vertex) => {
        if (!vert || (!vert.parent1_id && !vert.parent2_id)) {
            return colorUnknown;
        }
        if (vert.is_selected) {
            return colorSelected;
        }
        if (vert.is_milestone) {
            return colorMilestone;
        }
        if (vert.is_tip) {
            return colorTip;
        }
        if (vert.is_conflicting) {
            return colorConflicting;
        }
        if (vert.is_referenced) {
            return colorReferenced;
        }
        if (vert.is_solid) {
            return colorSolid;
        }
        return colorUnsolid;
    }

    sizeForVertexState = (vert: Vertex) => {
        if (!vert || (!vert.parent1_id && !vert.parent2_id)) {
            return vertexSizeSmall;
        }
        if (vert.is_selected) {
            return vertexSizeBig;
        }
        if (vert.is_milestone) {
            return vertexSizeBig;
        }
        return vertexSizeMedium;
    }

    updateNodeUI = (vert: Vertex) => {
        let nodeUI = this.graphics.getNodeUI(vert.id.substring(0,idLength));
        if (!nodeUI) return;
        nodeUI.color = parseColor(this.colorForVertexState(vert));
        nodeUI.size = this.sizeForVertexState(vert);
    }

    start = () => {

        this.collect = true;
        this.graph = Viva.Graph.graph();

        let graphics: any = Viva.Graph.View.webglGraphics();

        const layout = Viva.Graph.Layout.forceDirected(this.graph, {
            springLength: 10,
            springCoeff: 0.0001,
            stableThreshold: 0.15,
            gravity: -2,
            dragCoeff: 0.02,
            timeStep: 20,
            theta: 0.8,
        });

        graphics.node((node) => {
            if (!node.data) {
                return Viva.Graph.View.webglSquare(vertexSizeSmall, this.colorForVertexState(node.data));
            }
            return Viva.Graph.View.webglSquare(vertexSizeMedium, this.colorForVertexState(node.data));
        })
        graphics.link(() => Viva.Graph.View.webglLine(colorLink));
        let ele = document.getElementById('visualizer');
        this.renderer = Viva.Graph.View.renderer(this.graph, {
            container: ele, graphics, layout,
        });

        let events = Viva.Graph.webglInputEvents(graphics, this.graph);

        events.mouseEnter((node) => {
            this.clearSelected();
            this.updateSelected(this.vertices.get(node.id));
        }).mouseLeave((node) => {
            this.clearSelected();
        }).dblClick((node) => {
            this.openMessage(node.data);
        });
        this.graphics = graphics;
        this.renderer.run();
    }

    stop = () => {
        this.collect = false;
        this.renderer.dispose();
        this.graph = null;
        this.paused = false;
        this.selected = null;
        this.solid_count = 0;
        this.confirmed_count = 0;
        this.conflicting_count = 0;
        this.tips_count = 0;
        this.vertices.clear();
    }

    @action
    updateSelected = (vert: Vertex, viaClick?: boolean) => {
        if (!vert) return;

        vert.is_selected = true;

        this.selected = vert;
        this.selected_via_click = !!viaClick;

        // mutate links
        let node = this.graph.getNode(vert.id.substring(0,idLength));
        this.updateNodeUI(vert);

        // set -1 because starting node is also counted
        this.selected_children_count = -1;
        this.selected_parents_count = -1;

        const seenForward = [];
        const seenBackwards = [];
        dfsIterator(
            this.graph,
            node,
            node => {
                this.selected_children_count++;
            },
            true,
            link => {
                const linkUI = this.graphics.getLinkUI(link.id);
                if (linkUI) {
                    linkUI.color = parseColor(colorLinkChildren);
                }
            },
            seenForward
        );
        dfsIterator(
            this.graph,
            node,
            node => {
                this.selected_parents_count++;
            },
            false,
            link => {
                const linkUI = this.graphics.getLinkUI(link.id);
                if (linkUI) {
                    linkUI.color = parseColor(colorLinkParents);
                }
            },
            seenBackwards
        );
    }

    @action
    openMessage = (vert: Vertex) => {
        if (!vert) return;

        var win = window.open(`/explorer/msgs/${vert.id}`, '_blank', 'noopener');
        win.focus();
    }

    resetLinks = () => {
        this.graph.forEachLink(function (link) {
            const linkUI = this.graphics.getLinkUI(link.id);
            if (linkUI) {
                linkUI.color = parseColor(colorLink);
            }
        });
    }

    @action
    clearSelected = () => {
        this.selected_children_count = 0;
        this.selected_parents_count = 0;
        if (this.selected_via_click || !this.selected) {
            return;
        }

        this.selected.is_selected = false;

        // clear link highlight
        let node = this.graph.getNode(this.selected.id.substring(0,idLength));
        if (!node) {
            // clear links
            this.resetLinks();
            return;
        }

        this.updateNodeUI(this.selected);

        const seenForward = [];
        const seenBackwards = [];
        dfsIterator(
            this.graph,
            node,
            node => {},
            true,
            link => {
                const linkUI = this.graphics.getLinkUI(link.id);
                if (linkUI) {
                    linkUI.color = parseColor(colorLink);
                }
            },
            seenBackwards
        );
        dfsIterator(
            this.graph,
            node,
            node => {},
            false,
            link => {
                const linkUI = this.graphics.getLinkUI(link.id);
                if (linkUI) {
                    linkUI.color = parseColor(colorLink);
                }
            },
            seenForward
        );

        this.selected = null;
    }

}

export default VisualizerStore;

// copied over and refactored from https://github.com/glumb/IOTAtangle
// graph is the viva graph that contains the nodes.
// node is the starting node for the walk.
// cb is called on every node. If true, the links of the node are skipped.
// if up is true, the future cone is walked, otherwise past cone.
// cbLinks is called on every walked link.
// seenNodes is the array of walked nodes.
function dfsIterator(graph, node, cb, up, cbLinks: any = false, seenNodes = []) {
    seenNodes.push(node);
    let pointer = 0;

    while (seenNodes.length > pointer) {
        const node = seenNodes[pointer++];

        if (cb(node)) continue;

        for (const link of node.links) {

            if (!up && link.fromId === node.id.substring(0,idLength)) {
                if (cbLinks) cbLinks(link);

                if (!seenNodes.includes(graph.getNode(link.toId))) {
                    seenNodes.push(graph.getNode(link.toId));
                    continue;
                }
            }

            if (up && link.toId === node.id.substring(0,idLength)) {
                if (cbLinks) cbLinks(link);

                if (!seenNodes.includes(graph.getNode(link.fromId))) {
                    seenNodes.push(graph.getNode(link.fromId));
                }
            }
        }
    }
}

function parseColor(color): any {
    let parsedColor = 0x009ee8ff;

    if (typeof color === 'number') {
        return color;
    }

    if (typeof color === 'string' && color) {
        if (color.length === 4) {
            // #rgb, duplicate each letter except first #.
            color = color.replace(/([^#])/g, '$1$1');
        }
        if (color.length === 9) {
            // #rrggbbaa
            parsedColor = parseInt(color.substr(1), 16);
        } else if (color.length === 7) {
            // or #rrggbb.
            parsedColor = (parseInt(color.substr(1), 16) << 8) | 0xff;
        } else {
            throw 'Color expected in hex format with preceding "#". E.g. #00ff00. Got value: ' + color;
        }
    }

    return parsedColor;
}
