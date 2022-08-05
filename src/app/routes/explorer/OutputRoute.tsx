import { TransactionHelper } from "@iota/iota.js";
import React, { ReactNode } from "react";
import { Link, RouteComponentProps } from "react-router-dom";
import { ReactComponent as ChevronLeftIcon } from "../../../assets/chevron-left.svg";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { TangleService } from "../../../services/tangleService";
import AsyncComponent from "../../components/layout/AsyncComponent";
import Output from "../../components/tangle/Output";
import "./Block.scss";
import { OutputRouteProps } from "./OutputRouteProps";
import { OutputRouteState } from "./OutputRouteState";

/**
 * Component which will show the Output page.
 */
class OutputRoute extends AsyncComponent<RouteComponentProps<OutputRouteProps>, OutputRouteState> {
    /**
     * Service for tangle requests.
     */
    private readonly _tangleService: TangleService;

    /**
     * Timer to check to state update.
     */
    private _timerId?: NodeJS.Timer;

    /**
     * Create a new instance of Output route.
     * @param props The props.
     */
    constructor(props: RouteComponentProps<OutputRouteProps>) {
        super(props);

        this._tangleService = ServiceFactory.get<TangleService>("tangle");
        this.state = {};
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        super.componentDidMount();

        const outputResponse = await this._tangleService.outputDetails(this.props.match.params.outputId);

        if (outputResponse) {
            this.setState({
                outputResponse
            }, async () => {
                await this.updateOutputDetails();
            });
        } else {
            this.props.history.replace(`/explorer/search/${this.props.match.params.outputId}`);
        }
    }

    /**
     * The component will unmount so update flag.
     */
    public componentWillUnmount(): void {
        super.componentWillUnmount();
        if (this._timerId) {
            clearTimeout(this._timerId);
            this._timerId = undefined;
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="block">
                <div className="content">
                    <Link
                        to="/explorer"
                        className="row middle inline"
                    >
                        <ChevronLeftIcon className="secondary" />
                        <h3 className="secondary margin-l-s">Back to Explorer</h3>
                    </Link>
                    <div className="card margin-t-m padding-l">
                        <div className="row phone-down-column start">
                            <h2 className="margin-r-l">
                                Output
                            </h2>
                        </div>
                        {this.state.outputResponse && (
                            <Output
                                showDetails={true}
                                outputId={TransactionHelper.outputIdFromTransactionData(
                                    this.state.outputResponse.metadata.transactionId,
                                    this.state.outputResponse.metadata.outputIndex)}
                                output={this.state.outputResponse.output}
                                metadata={this.state.outputResponse.metadata}
                            />
                        )}

                    </div>
                </div>
            </div>
        );
    }

    /**
     * Update the block details.
     */
    private async updateOutputDetails(): Promise<void> {
        const outputResponse = await this._tangleService.outputDetails(this.props.match.params.outputId);

        if (outputResponse) {
            this.setState({
                outputResponse
            });
        }
        this._timerId = setTimeout(async () => {
            await this.updateOutputDetails();
        }, 10000);
    }
}

export default OutputRoute;
