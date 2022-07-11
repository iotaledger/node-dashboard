import { OutputTypes } from "@iota/iota.js";
import React, { Component, ReactNode } from "react";
import { IAssociatedOutput } from "../../../models/tangle/IAssociatedOutputsResponse";
import Pagination from "../layout/Pagination";
import Spinner from "../layout/Spinner";
import Output from "./Output";
import { OutputsProps } from "./OutputsProps";
import { OutputsState } from "./OutputsState";

/**
 * Component which will display outputs.
 */
class Outputs extends Component<OutputsProps, OutputsState> {
    /**
     * Create a new instance of Outputs.
     * @param props The props.
     */
    constructor(props: OutputsProps) {
        super(props);

        let outputs: OutputTypes[] | IAssociatedOutput[] = [];

        if (this.props.outputTypes) {
            outputs = this.props.outputTypes;
        }
        if (this.props.associatedOutputs) {
            outputs = this.props.associatedOutputs;
        }
        this.state = {
          currentPage: this.props.currentPage,
          outputs
        };
    }

    /**
     * The outputs on current page.
     * @returns The outputs
     */
     private get currentPageOutputs() {
        if (this.state.outputs.length > 0) {
            return this.state.outputs.slice(...this.getPageIndexes());
        }
        return [];
    }

    /**
     * The component mounted.
     */
    public componentDidMount(): void {
        if (this.props.onPageChange) {
            this.props.onPageChange(this.state.currentPage, ...this.getPageIndexes());
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div>
                <div className="card margin-t-m padding-l">
                    <div className="row spread">
                        <div className="card--header">
                            <h2 className="card--header__title">{this.props.title}</h2>
                            <span className="card--header-count">
                                {this.state.outputs.length}
                            </span>
                        </div>
                        {this.props.statusBusy && (
                            <div className="card--header">
                                <Spinner compact={true} />
                                <p className="status margin-l-s">
                                    Loading outputs...
                                </p>
                            </div>
                        )}
                    </div>

                    {this.props.outputTypes && (this.currentPageOutputs as OutputTypes[]).map((output, idx) => (
                        <Output
                            key={((this.props.currentPage - 1) * this.props.pageSize) + idx + 1}
                            index={((this.props.currentPage - 1) * this.props.pageSize) + idx + 1}
                            output={output}
                        />
                    ))}

                    {this.props.associatedOutputs &&
                    (this.currentPageOutputs as IAssociatedOutput[]).map((output, idx) => (
                        <Output
                            key={output.outputId}
                            index={((this.state.currentPage - 1) * this.props.pageSize) + idx + 1}
                            output={output.outputDetails?.output ?? {} as OutputTypes}
                            metadata={output.outputDetails?.metadata}
                        />
                    ))}

                    <Pagination
                        currentPage={this.state.currentPage}
                        totalCount={this.state.outputs.length}
                        pageSize={this.props.pageSize}
                        extraPageRangeLimit={this.props.extraPageRangeLimit}
                        siblingsCount={this.props.siblingsCount}
                        onPageChange={(page: number) =>
                            this.setState({ currentPage: page },
                                () => {
                                    if (this.props.onPageChange) {
                                        this.props.onPageChange(this.state.currentPage, ...this.getPageIndexes());
                                    }
                                }
                            )}
                    />
                </div>
                {this.state.outputs.length === 0 && (
                    <div className="card margin-t-m padding-l">
                        <h2 className="margin-b-s">{this.props.title}</h2>
                        {this.state.outputs && (
                            <div className="card--value">
                                There are no outputs for this address.
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    /**
     * Get first and last item index.
     * @returns The first and last item index on the current page.
     */
    private getPageIndexes() {
        const firstPageIndex = (this.state.currentPage - 1) * this.props.pageSize;
        const lastPageIndex =
            (this.state.currentPage === Math.ceil(this.state.outputs.length / this.props.pageSize))
            ? this.state.outputs.length
            : firstPageIndex + this.props.pageSize;
        return [firstPageIndex, lastPageIndex] as const;
    }
}

export default Outputs;
