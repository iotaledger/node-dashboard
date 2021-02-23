import { ArrayHelper } from "@iota/iota.js";
import classNames from "classnames";
import React, { ReactNode } from "react";
import AsyncComponent from "./AsyncComponent";
import "./Graph.scss";
import { GraphProps } from "./GraphProps";
import { GraphState } from "./GraphState";

/**
 * Graph.
 */
class Graph extends AsyncComponent<GraphProps, GraphState> {
    /**
     * The graph element.
     */
    private _graphElement: SVGSVGElement | null;

    /**
     * The resize method
     */
    private readonly _resize: () => void;

    /**
     * Create a new instance of Graph.
     * @param props The props.
     */
    constructor(props: GraphProps) {
        super(props);

        this._graphElement = null;
        this._resize = () => this.resize();

        this.state = {};
    }

    /**
     * The component did mount.
     */
    public componentDidMount(): void {
        super.componentDidMount();
        window.addEventListener("resize", this._resize);
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
     * The component will unmount.
     */
    public componentWillUnmount(): void {
        super.componentWillUnmount();
        this._graphElement = null;
        window.removeEventListener("resize", this._resize);
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
                                textAnchor={t.anchor ?? "start"}
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
        setTimeout(() => {
            if (!this._graphElement && element) {
                this._graphElement = element;
                this.setState(this.calculateGraph());
            }
        }, 100);
    }

    /**
     * The window was resized.
     */
    private resize(): void {
        if (this._graphElement) {
            this.setState(this.calculateGraph());
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
            const axisLabelHeight = 20;

            try {
                const graphWidth = this._graphElement.width.baseVal.value;
                const graphHeight = this._graphElement.height.baseVal.value - axisLabelHeight;

                let seriesMaxLength = this.props.seriesMaxLength;
                if (graphWidth < 500) {
                    seriesMaxLength /= 2;
                }

                const actualSeriesValues: number[][] =
                    this.props.series.map(s => s.values.slice(-seriesMaxLength));

                let maxY = 0;
                const maxItems = Math.min(seriesMaxLength, actualSeriesValues[0].length);

                for (let i = 0; i < actualSeriesValues.length; i++) {
                    for (let j = 0; j < actualSeriesValues[i].length; j++) {
                        if (actualSeriesValues[i][j] > maxY) {
                            maxY = actualSeriesValues[i][j];
                        }
                    }
                }

                if (maxY === 0) {
                    maxY = 4;
                }

                const yUsage = 0.9;
                const axisLabelWidth = 30;
                const marginLeft = 10;
                const marginRight = 10;
                const axisLineCount = 4;
                const decimalPlaces = maxY < 2 ? 2 : 0;

                const yScale = (graphHeight * yUsage) / maxY;
                const barWidth = (graphWidth - axisLabelWidth - marginLeft - marginRight) /
                    (seriesMaxLength * this.props.series.length);
                const axisSpacing = graphHeight / (axisLineCount - 1);

                for (let i = 0; i < axisLineCount; i++) {
                    axis.push({
                        path: `M ${axisLabelWidth} ${graphHeight - (i * axisSpacing)
                            } L ${graphWidth} ${graphHeight - (i * axisSpacing)}`,
                        className: "axis-color"
                    });
                    text.push({
                        x: axisLabelWidth - 5,
                        y: graphHeight - (i * axisSpacing) + 2,
                        anchor: "end",
                        content: (i * ((maxY / yUsage) / (axisLineCount - 1))).toFixed(decimalPlaces)
                    });
                }

                if (this.props.timeInterval && this.props.endTime) {
                    let numTimeEntries = this.props.timeMarkers ?? Math.floor(graphWidth / 100);
                    if (graphWidth < 300) {
                        numTimeEntries = 3;
                    }
                    const startTime = this.props.endTime - (maxItems * this.props.timeInterval);
                    const timePerInterval = (seriesMaxLength * this.props.timeInterval) / numTimeEntries;
                    for (let i = 0; i <= numTimeEntries; i++) {
                        const dt = new Date(startTime + (i * timePerInterval));
                        text.push({
                            x: marginLeft + (axisLabelWidth / 2) +
                                (((graphWidth - marginLeft - marginRight) / numTimeEntries) * i),
                            y: graphHeight + axisLabelHeight,
                            anchor: "middle",
                            content: `${dt.getHours().toString()
                                .padStart(2, "0")}:${dt.getMinutes().toString()
                                    .padStart(2, "0")}.${dt.getSeconds().toString()
                                        .padStart(2, "0")}`
                        });
                    }
                }

                for (let i = 0; i < maxItems; i++) {
                    for (let j = 0; j < actualSeriesValues.length; j++) {
                        const val = actualSeriesValues[j][i];
                        paths.push({
                            path: this.calculatePath(
                                graphHeight,
                                barWidth,
                                axisLabelWidth + marginLeft,
                                j + (i * actualSeriesValues.length),
                                val * yScale),
                            className: this.props.series[j].className
                        });
                    }
                }
            } catch {}
        }

        return {
            text,
            paths: [...axis, ...paths.reverse()]
        };
    }

    /**
     * Calculate the path for the bar.
     * @param graphHeight The height of the graph.
     * @param barWidth The width of bars.
     * @param marginLeft The left margin for axis.
     * @param index The bar index.
     * @param scaledVal The end value.
     * @returns The path.
     */
    private calculatePath(
        graphHeight: number, barWidth: number, marginLeft: number,
        index: number, scaledVal: number): string {
        const spacing = 2;
        let pathSegments = [`M ${marginLeft + (index * barWidth) + spacing} ${graphHeight}`];

        pathSegments = [
            ...pathSegments,
            ...(scaledVal <= 0 ? [
                `L ${marginLeft + ((index * barWidth) + spacing)} ${graphHeight - 1}`,
                `L ${marginLeft + ((index + 1) * barWidth) - spacing} ${graphHeight - 1}`,
                `L ${marginLeft + ((index + 1) * barWidth) - spacing} ${graphHeight}`
            ] : [
                    `L ${marginLeft + (index * barWidth) + spacing} ${graphHeight - scaledVal}`,
                    `C ${marginLeft + (index * barWidth) + spacing} ${graphHeight - scaledVal - 10
                    } ${marginLeft + ((index + 1) * barWidth) - spacing} ${graphHeight - scaledVal - 10
                    } ${marginLeft + ((index + 1) * barWidth) - spacing} ${graphHeight - scaledVal}`,
                    `L ${marginLeft + ((index + 1) * barWidth) - spacing} ${graphHeight}`
                ])
        ];

        return pathSegments.join(" ");
    }
}

export default Graph;
