import { OutputTypes } from "@iota/iota.js";
import React, { Component, ReactNode } from "react";
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

        this.state = {
          currentPage: this.props.currentPage
        };
    }

    /**
     * The outputs on current page.
     * @returns The outputs
     */
    private get currentPageOutputs() {
        if (this.props.outputs.length > 0) {
            return this.props.outputs.slice(...this.getPageIndexes());
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
                                {this.props.outputs.length}
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

                    {this.currentPageOutputs.map((output, idx) => (
                        <Output
                            key={output.outputId}
                            index={((this.state.currentPage - 1) * this.props.pageSize) + idx + 1}
                            outputId={output.outputId}
                            output={output.outputType ?? (output.outputDetails?.output ?? {} as OutputTypes)}
                            metadata={output.outputDetails?.metadata}
                        />
                    ))}

                    <Pagination
                        currentPage={this.state.currentPage}
                        totalCount={this.props.outputs.length}
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
                {this.props.outputs.length === 0 && (
                    <div className="card margin-t-m padding-l">
                        <h2 className="margin-b-s">{this.props.title}</h2>
                        {this.props.outputs && (
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
            (this.state.currentPage === Math.ceil(this.props.outputs.length / this.props.pageSize))
            ? this.props.outputs.length
            : firstPageIndex + this.props.pageSize;
        return [firstPageIndex, lastPageIndex] as const;
    }
}

export default Outputs;
