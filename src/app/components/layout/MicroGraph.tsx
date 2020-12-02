import classNames from "classnames";
import React, { Component, ReactNode } from "react";
import "./MicroGraph.scss";
import { MicroGraphProps } from "./MicroGraphProps";
import { MicroGraphState } from "./MicroGraphState";

/**
 * Micro Graph.
 */
class MicroGraph extends Component<MicroGraphProps, MicroGraphState> {
    /**
     * The graph width.
     */
    private readonly _graphWidth: number;

    /**
     * The graph height.
     */
    private readonly _graphHeight: number;

    /**
     * Create a new instance of MicroGraph.
     * @param props The props.
     */
    constructor(props: MicroGraphProps) {
        super(props);

        this._graphWidth = this.props.graphWidth ?? 80;
        this._graphHeight = this.props.graphHeight ?? 10;

        this.state = {
            ...this.calculateGraph()
        };
    }

    /**
     * The component updated.
     * @param prevProps The previous properties.
     */
    public componentDidUpdate(prevProps: MicroGraphProps): void {
        if (this.props.values !== prevProps.values) {
            this.setState(this.calculateGraph());
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className={classNames("micro-graph", this.props.className)}>
                <span className="label">{this.props.label}</span>
                <span className="value">{this.props.value}</span>
                <span className="canvas">
                    <svg
                        width={this._graphWidth}
                        height={this._graphHeight}
                    >
                        {this.state.graphPoints && this.state.graphPoints.length > 0 && (
                            <path
                                d={this.state.graphPoints.map(g => `${g.type} ${g.x} ${g.y}`).join(" ")}
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                            />
                        )}
                        {this.state.circle && this.state.circle.x >= 0 && (
                            <circle
                                cx={this.state.circle.x}
                                cy={this.state.circle.y}
                                r="3"
                                fill="currentColor"
                            />
                        )}
                    </svg>
                </span>
            </div>
        );
    }

    /**
     * Calculate the graph points.
     * @returns The graph points.
     */
    private calculateGraph(): {
        graphPoints: {
            type: string;
            x: number;
            y: number;
        }[];
        circle: {
            x: number;
            y: number;
        };
    } {
        const graphPointCount = this._graphWidth / 2;

        const lastItems = this.props.values.slice(-graphPointCount);
        let min;
        let max;
        let circleX = -1;
        let circleY = -1;

        for (let i = 0; i < lastItems.length; i++) {
            if (min === undefined || lastItems[i] < min) {
                min = lastItems[i];
            }
            if (max === undefined || lastItems[i] > max) {
                max = lastItems[i];
            }
        }

        const graphPoints = [];
        if (max !== undefined && min !== undefined) {
            const range = max - min;
            const scale = range === 0 ? 1 : range / this._graphHeight;

            let lastY = (lastItems[0] - min) / scale;
            graphPoints.push({
                type: "M",
                x: 0,
                y: this._graphHeight - lastY
            });

            const xIncrement = (graphPointCount / lastItems.length) * 2;
            for (let i = 1; i < lastItems.length; i++) {
                const y = (lastItems[i] - min) / scale;
                graphPoints.push({
                    type: "l",
                    x: xIncrement,
                    y: (y - lastY) * -1
                });
                lastY = y;
            }

            circleX = (lastItems.length - 1) * xIncrement;
            circleY = 10 - lastY;
        }

        return {
            graphPoints,
            circle: { x: circleX, y: circleY }
        };
    }
}

export default MicroGraph;
