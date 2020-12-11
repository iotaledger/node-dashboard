import { IOutputResponse, UnitsHelper } from "@iota/iota.js";
import React, { ReactNode } from "react";
import { Link, RouteComponentProps } from "react-router-dom";
import { ReactComponent as ChevronLeftIcon } from "../../../assets/chevron-left.svg";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { TangleService } from "../../../services/tangleService";
import { Bech32AddressHelper } from "../../../utils/bech32AddressHelper";
import AsyncComponent from "../../components/layout/AsyncComponent";
import Spinner from "../../components/layout/Spinner";
import Bech32Address from "../../components/tangle/Bech32Address";
import Output from "../../components/tangle/Output";
import "./Address.scss";
import { AddressRouteProps } from "./AddressRouteProps";
import { AddressState } from "./AddressState";

/**
 * Component which will show the address page.
 */
class Address extends AsyncComponent<RouteComponentProps<AddressRouteProps>, AddressState> {
    /**
     * Service for tangle requests.
     */
    private readonly _tangleService: TangleService;

    /**
     * Create a new instance of Address.
     * @param props The props.
     */
    constructor(props: RouteComponentProps<AddressRouteProps>) {
        super(props);

        this._tangleService = ServiceFactory.get<TangleService>("tangle");

        this.state = {
            ...Bech32AddressHelper.buildAddress(props.match.params.address),
            formatFull: false,
            statusBusy: true,
            status: "Loading outputs..."
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        super.componentDidMount();

        const result = await this._tangleService.search(this.props.match.params.address);

        if (result?.address) {
            this.setState({
                address: result.address,
                bech32AddressDetails: Bech32AddressHelper.buildAddress(result.address.address),
                balance: result.address.balance,
                outputIds: result.addressOutputIds
            }, async () => {
                const outputs: IOutputResponse[] = [];

                if (result.addressOutputIds) {
                    for (const outputId of result.addressOutputIds) {
                        const outputResult = await this._tangleService.search(outputId);

                        if (outputResult?.output) {
                            outputs.push(outputResult?.output);
                        }
                    }
                }

                this.setState({
                    outputs,
                    status: "",
                    statusBusy: false
                });
            });
        } else {
            this.props.history.replace(`/explorer/search/${this.props.match.params.address}`);
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="address">
                <div className="content">
                    <Link
                        to="/explorer"
                        className="row inline"
                    >
                        <ChevronLeftIcon className="secondary" />
                        <h3 className="secondary margin-l-s">Back to Explorer</h3>
                    </Link>
                    <div className="card margin-t-m padding-l">
                        <h2>Address</h2>
                        <Bech32Address
                            activeLinks={false}
                            addressDetails={this.state.bech32AddressDetails}
                        />
                        {this.state.balance !== undefined && (
                            <div>
                                <div className="card--label">
                                    Balance
                                </div>
                                <div className="card--value card--value__mono">
                                    <button
                                        className="card--value--button"
                                        type="button"
                                        onClick={() => this.setState(
                                            {
                                                formatFull: !this.state.formatFull
                                            }
                                        )}
                                    >
                                        {this.state.formatFull
                                            ? `${this.state.balance} i`
                                            : UnitsHelper.formatBest(this.state.balance)}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {(this.state.statusBusy ||
                        (this.state.outputs && this.state.outputs.length === 0)) && (
                            <div className="card margin-t-m padding-l">
                                <h2 className="margin-b-s">Outputs</h2>
                                {this.state.statusBusy && (<Spinner />)}
                                {this.state.outputs && this.state.outputs.length === 0 && (
                                    <div className="card--value">
                                        There are no outputs for this address.
                                    </div>
                                )}
                            </div>
                        )}

                    {this.state.outputs &&
                        this.state.outputIds &&
                        this.state.outputs.length > 0 &&
                        this.state.outputs.map((output, idx) => (
                            <div className="card margin-t-m padding-l" key={idx}>
                                <Output
                                    key={idx}
                                    id={this.state.outputIds ? this.state.outputIds[idx] : ""}
                                    output={output}
                                />
                            </div>
                        ))}
                </div>
            </div>
        );
    }
}

export default Address;
