import { ArrayHelper } from "@iota/iota.js";
import classNames from "classnames";
import React, { Component, ReactNode } from "react";
import "./Graph.scss";
import { GraphProps } from "./GraphProps";
import { GraphState } from "./GraphState";

/**
 * Graph.
 */
class Graph extends Component<GraphProps, GraphState> {
    /**
     * The graph element.
     */
    private _graphElement: SVGSVGElement | null;

    /**
     * Create a new instance of Graph.
     * @param props The props.
     */
    constructor(props: GraphProps) {
        super(props);

        this._graphElement = null;

        this.state = {
        };
    }

    /**
     * The component updated.
     * @param prevProps The previous properties.
     */
    public componentDidUpdate(prevProps: GraphProps): void {
        let dataEqual = this.props.series.length === prevProps.series.length;
        if (dataEqual) {
            for (let i = 0; i < this.props.series.length; i++) {
                dataEqual = ArrayHelper.equal(this.props.series[i].values, prevProps.series[i].values);
                if (!dataEqual) {
                    break;
                }
            }
        }
        if (!dataEqual) {
            this.setState(this.calculateGraph());
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className={classNames("graph", this.props.className)}>
                <div className="title-row">
                    <div className="caption">{this.props.caption}</div>
                    <div className="key">
                        {this.props.series.length > 1 && this.props.series.map((s, idx) => (
                            <span key={idx} className="key">
                                <div className={classNames("key-color", s.className)} />
                                <span className="key-label">
                                    {s.label}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
                <span className="canvas">
                    <svg
                        ref={r => this.setElement(r)}
                    >
                        {this.state.paths?.map((b, idx) => (
                            <path key={idx} d={b.path} className={b.className} strokeWidth={1} />
                        ))}
                        {this.state.text?.map((t, idx) => (
                            <text
                                key={idx}
                                x={t.x}
                                y={t.y}
                                className="axis-label"
                            >
                                {t.content}
                            </text>
                        ))}
                    </svg>
                </span>
            </div>
        );
    }

    /**
     * Set the graph element.
     * @param element The element.
     */
    private setElement(element: SVGSVGElement | null): void {
        if (!this._graphElement && element) {
            this._graphElement = element;

            setTimeout(() => this.setState(this.calculateGraph()), 50);
        }
    }

    /**
     * Calculate the graph points.
     * @returns The graph points.
     */
    private calculateGraph(): {
        paths: {
            path: string;
            className: string;
        }[];
        text: {
            x: number;
            y: number;
            content: string;
        }[];
    } {
        const paths = [];
        const text = [];
        const axis = [];

        if (this._graphElement && this.props.series.length > 0) {
            const graphWidth = this._graphElement.width.baseVal.value;
            const graphHeight = this._graphElement.height.baseVal.value;

            let maxY = 4;
            const maxItems = Math.min(this.props.seriesMaxLength, this.props.series[0].values.length);

            for (let i = 0; i < maxItems; i++) {
                let combinedTotal = 0;
                for (let j = 0; j < this.props.series.length; j++) {
                    combinedTotal += this.props.series[j].values[i];
                }
                if (combinedTotal > maxY) {
                    maxY = combinedTotal;
                }
            }

            const yUsage = 0.9;
            const axisLabelWidth = 30;
            const marginLeft = 10;
            const marginRight = 10;
            const axisLineCount = 4;

            const yScale = (graphHeight * yUsage) / maxY;
            const barWidth = (graphWidth - axisLabelWidth - marginLeft - marginRight) / this.props.seriesMaxLength;
            const axisSpacing = graphHeight / (axisLineCount - 1);

            for (let i = 0; i < axisLineCount; i++) {
                axis.push({
                    path: `M ${axisLabelWidth} ${graphHeight - (i * axisSpacing)
                        } L ${graphWidth} ${graphHeight - (i * axisSpacing)}`,
                    className: "axis-color"
                });
                text.push({
                    x: 0,
                    y: graphHeight - (i * axisSpacing) + 2,
                    content: Math.round((i * ((maxY / yUsage) / (axisLineCount - 1)))).toString()
                });
            }

            for (let i = 0; i < maxItems; i++) {
                let lastY = graphHeight;
                let lastVal = 0;
                for (let j = 0; j < this.props.series.length; j++) {
                    const val = this.props.series[j].values[i];
                    paths.push({
                        path: this.calculatePath(
                            graphHeight, barWidth, axisLabelWidth + marginLeft, i, lastY, (val + lastVal) * yScale),
                        className: this.props.series[j].className
                    });
                    lastY -= val * yScale;
                    lastVal += val;
                }
            }
        }

        return {
            text,
            paths: axis.concat(paths.reverse())
        };
    }

    /**
     * Calculate the path for the bar.
     * @param graphHeight The height of the graph.
     * @param barWidth The width of bars.
     * @param marginLeft The left margin for axis.
     * @param index The bar index.
     * @param startY The start value.
     * @param endY The end value.
     * @returns The path.
     */
    private calculatePath(
        graphHeight: number, barWidth: number, marginLeft: number,
        index: number, startY: number, endY: number): string {
        const spacing = 2;
        const pathSegments = [
            `M ${marginLeft + (index * barWidth) + spacing} ${startY}`,
            `L ${marginLeft + (index * barWidth) + spacing} ${graphHeight - endY}`,
            `C ${marginLeft + (index * barWidth) + spacing} ${graphHeight - endY - 10
            } ${marginLeft + ((index + 1) * barWidth) - spacing} ${graphHeight - endY - 10
            } ${marginLeft + ((index + 1) * barWidth) - spacing} ${graphHeight - endY}`,
            `L ${marginLeft + ((index + 1) * barWidth) - spacing} ${startY}`
        ];
        return pathSegments.join(" ");
    }
}

export default Graph;
