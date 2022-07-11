import React, { ReactNode } from "react";
import { Link, RouteComponentProps } from "react-router-dom";
import { ReactComponent as ChevronLeftIcon } from "../../../assets/chevron-left.svg";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { TangleService } from "../../../services/tangleService";
import AsyncComponent from "../../components/layout/AsyncComponent";
import Outputs from "../../components/tangle/Outputs";
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
            outputs: []
        };
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
                        <Outputs
                            associatedOutputs={this.state.outputs}
                            currentPage={1}
                            pageSize={15}
                            extraPageRangeLimit={20}
                            siblingsCount={1}
                            statusBusy={this.state.statusBusy}
                            title="Outputs"
                            onPageChange={(page: number, firstPageIndex: number, lastPageIndex: number) => {
                                if (this.state.outputs.length > 0) {
                                    this.updateOutputDetails(firstPageIndex, lastPageIndex)
                                    .catch(err => console.error(err));
                                }
                            }}
                        />
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
            this.setState({
                statusBusy: true
            });
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
                        outputs
                    });
                }
            }

            this.setState({
                    statusBusy: false
                });
        }
    }
}

export default OutputsRoute;
