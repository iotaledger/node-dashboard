import { IOutputResponse } from "@iota/iota.js";
import React, { ReactNode } from "react";
import { Link, RouteComponentProps } from "react-router-dom";
import { ReactComponent as ChevronLeftIcon } from "../../../assets/chevron-left.svg";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { TangleService } from "../../../services/tangleService";
import AsyncComponent from "../../components/layout/AsyncComponent";
import Pagination from "../../components/layout/Pagination";
import Spinner from "../../components/layout/Spinner";
import Output from "../../components/tangle/Output";
import "./OutputsRoute.scss";
import { OutputsRouteProps } from "./OutputsRouteProps";
import { OutputsRouteState } from "./OutputsRouteState";

/**
 * Component which will show the outputs page.
 */
class OutputsRoute extends AsyncComponent<RouteComponentProps<OutputsRouteProps>, OutputsRouteState> {
    /**
     * Service for tangle requests.
     */
    private readonly _tangleService: TangleService;

    /**
     * Create a new instance of Outputs.
     * @param props The props.
     */
    constructor(props: RouteComponentProps<OutputsRouteProps>) {
        super(props);

        this._tangleService = ServiceFactory.get<TangleService>("tangle");

        this.state = {
            statusBusy: true,
            currentPage: 1,
            pageSize: 10,
            outputs: [],
            status: "Loading outputs..."
        };
    }

    private get currentPageOutputs() {
        if (this.state.outputs.length > 0) {
            const [firstPageIndex, lastPageIndex] = this.getPageIndexes();

            return this.state.outputs.slice(firstPageIndex, lastPageIndex);
        }
        return [];
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        super.componentDidMount();

        const associatedOutputs = await this._tangleService.getOutputsByTag(this.props.match.params.tag);

        if (associatedOutputs.length > 0) {
            const sortedResults = associatedOutputs.sort((a, b) => a.association - b.association);
            const outputs = [
                /* eslint-disable-next-line unicorn/no-array-reduce */
                ...sortedResults.reduce((outputsMap, output) =>
                (outputsMap.has(output.outputId) ? outputsMap : outputsMap.set(output.outputId, output)),
                new Map()).values()
            ];

            this.setState({
                outputs
            }, async () => {
                if (this.state.outputs.length > 0) {
                    const [firstPageIndex, lastPageIndex] = this.getPageIndexes();

                    this.updateOutputDetails(firstPageIndex, lastPageIndex)
                        .catch(err => console.error(err));
                }
            });
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="outputs">
                <div className="content">
                    <Link
                        to="/explorer"
                        className="row middle inline"
                    >
                        <ChevronLeftIcon className="secondary" />
                        <h3 className="secondary margin-l-s">Back to Explorer</h3>
                    </Link>
                    {this.state.outputs.length > 0 && (
                        <div className="card margin-t-m padding-l">
                            <div className="row spread">
                                <div className="card--header">
                                    <h2 className="card--header__title">Outputs</h2>
                                    <span className="card--header-count">
                                        {this.state.outputs.length}
                                    </span>
                                </div>
                                {this.state.status && (
                                    <div className="card--header">
                                        {this.state.statusBusy && (<Spinner compact={true} />)}
                                        <p className="status margin-l-s">
                                            {this.state.status}
                                        </p>
                                    </div>
                                )}
                            </div>
                            {this.currentPageOutputs.map((output, idx) => (
                                <Output
                                    key={output.outputId}
                                    index={((this.state.currentPage - 1) * this.state.pageSize) + idx + 1}
                                    output={output.outputDetails ?? {} as IOutputResponse}
                                    outputId={output.outputId}
                                />
                            ))}

                            <Pagination
                                currentPage={this.state.currentPage}
                                totalCount={this.state.outputs.length}
                                pageSize={this.state.pageSize}
                                extraPageRangeLimit={20}
                                siblingsCount={1}
                                onPageChange={page =>
                                    this.setState({ currentPage: page },
                                        () => {
                                            if (this.state.outputs.length > 0) {
                                                const [firstPageIndex, lastPageIndex] = this.getPageIndexes();

                                                this.updateOutputDetails(firstPageIndex, lastPageIndex)
                                                    .catch(err => console.error(err));
                                            }
                                    })}
                            />
                        </div>
                    )}
                    {this.state.outputs.length === 0 && (
                        <div className="card margin-t-m padding-l">
                            <h2 className="margin-b-s">Outputs</h2>
                            {this.state.outputs && (
                                <div className="card--value">
                                    There are no outputs for this tag.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    /**
     * Update output details from start to end index.
     * @param startIndex The start index of the output.
     * @param endIndex The end index of the output.
     */
    private async updateOutputDetails(startIndex: number, endIndex: number) {
        if (this.state.outputs && this.state.outputs.length > 0) {
            const updatingPage = this.state.currentPage;
            for (let i = startIndex; i < endIndex; i++) {
                if (updatingPage !== this.state.currentPage) {
                    break;
                }
                const associatedOutput = this.state.outputs[i];
                const outputResult = await this._tangleService.outputDetails(associatedOutput.outputId);
                if (outputResult) {
                    const outputs = [...this.state.outputs];
                    outputs[i].outputDetails = outputResult;

                    this.setState({
                        outputs,
                        status: "Loading outputs..."
                    });
                }
            }

            this.setState({
                    status: "",
                    statusBusy: false
                });
        }
    }

    /**
     * Get first and last item index.
     * @returns The first and last item index on the current page.
     */
    private getPageIndexes() {
        const firstPageIndex = (this.state.currentPage - 1) * this.state.pageSize;
        const lastPageIndex =
            (this.state.currentPage === Math.ceil(this.state.outputs.length / this.state.pageSize))
            ? this.state.outputs.length
            : firstPageIndex + this.state.pageSize;
        return [firstPageIndex, lastPageIndex] as const;
    }
}

export default OutputsRoute;
