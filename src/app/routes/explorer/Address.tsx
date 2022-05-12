import { IOutputResponse } from "@iota/iota.js";
import classNames from "classnames";
import React, { ReactNode } from "react";
import { Link, RouteComponentProps } from "react-router-dom";
import { ReactComponent as ChevronLeftIcon } from "../../../assets/chevron-left.svg";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { NodeConfigService } from "../../../services/nodeConfigService";
import { TangleService } from "../../../services/tangleService";
import { Bech32AddressHelper } from "../../../utils/bech32AddressHelper";
import { FormatHelper } from "../../../utils/formatHelper";
import AsyncComponent from "../../components/layout/AsyncComponent";
import Spinner from "../../components/layout/Spinner";
import Bech32Address from "../../components/tangle/Bech32Address";
import Output from "../../components/tangle/Output";
import Token from "../../components/tangle/Token";
import { ReactComponent as DropdownIcon } from "./../../../assets/dropdown-arrow.svg";
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
     * The bech32 hrp from the node.
     */
    private readonly _bech32Hrp: string;

    /**
     * Create a new instance of Address.
     * @param props The props.
     */
    constructor(props: RouteComponentProps<AddressRouteProps>) {
        super(props);

        this._tangleService = ServiceFactory.get<TangleService>("tangle");

        const nodeConfigService = ServiceFactory.get<NodeConfigService>("node-config");
        this._bech32Hrp = nodeConfigService.getBech32Hrp();

        this.state = {
            ...Bech32AddressHelper.buildAddress(props.match.params.address, this._bech32Hrp),
            formatFull: false,
            statusBusy: true,
            showTokens: false,
            status: "Loading outputs..."
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        super.componentDidMount();

        const result = await this._tangleService.search(this.props.match.params.address);

        if (result?.address?.address) {
            this.setState({
                address: result.address,
                bech32AddressDetails: Bech32AddressHelper.buildAddress(result.address.address, this._bech32Hrp),
                balance: result.address.balance,
                outputIds: result.addressOutputIds
            }, async () => {
                const outputs: IOutputResponse[] = [];

                if (result.addressOutputIds) {
                    for (const outputId of result.addressOutputIds) {
                        const outputResult = await this._tangleService.outputDetails(outputId);

                        if (outputResult) {
                            outputs.push(outputResult);

                            this.setState({
                                outputs,
                                status: `Loading outputs [${outputs.length}/${result.addressOutputIds.length}]`
                            });
                        }

                        if (!this._isMounted) {
                            break;
                        }
                    }
                }

                this.setState({
                    outputs,
                    status: "",
                    statusBusy: false
                });
            });
        } else if (result?.unavailable) {
            this.props.history.replace("/explorer/unavailable");
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
                        className="row middle inline"
                    >
                        <ChevronLeftIcon className="secondary" />
                        <h3 className="secondary margin-l-s">Back to Explorer</h3>
                    </Link>
                    <div className="card margin-t-m padding-l">
                        <div className="card--content padding-0">
                            <h2>Address</h2>
                            {this.state.bech32AddressDetails && (
                                <Bech32Address
                                    activeLinks={false}
                                    showHexAddress={true}
                                    addressDetails={this.state.bech32AddressDetails}
                                />
                            )}
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
                                            {FormatHelper.getInstance().amount(
                                                Number(this.state.balance),
                                                this.state.formatFull
                                            )}
                                        </button>
                                    </div>
                                    {this.state.address?.nativeTokens && (
                                        <React.Fragment>
                                            <div
                                                className="card--content__input margin-t-s"
                                                onClick={() => this.setState({ showTokens: !this.state.showTokens })}
                                            >
                                                <div className={classNames(
                                                        "margin-r-t",
                                                        "card--content__input--dropdown",
                                                        { "opened": this.state.showTokens }
                                                    )}
                                                >
                                                    <DropdownIcon />
                                                </div>
                                                <h3 className="card--content__input--label">
                                                    Native Tokens
                                                </h3>
                                            </div>
                                            {this.state.showTokens && (
                                                <div className="card--content--border-l">
                                                    {Object.keys(this.state.address?.nativeTokens).map((key, idx) => (
                                                        <Token
                                                            key={idx}
                                                            index={idx}
                                                            token={{
                                                                id: key,
                                                                amount: this.state.address
                                                                        ? this.state.address?.nativeTokens[key]
                                                                            .toString()
                                                                        : "0"
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </React.Fragment>
                                    )}
                                </div>
                            )}
                            {this.state.status && (
                                <div className="middle row margin-t-m">
                                    {this.state.statusBusy && (<Spinner compact={true} />)}
                                    <p className="status margin-l-s">
                                        {this.props.match.params.address}
                                        <br />
                                        {this.state.status}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {this.state.outputs &&
                        this.state.outputIds &&
                        this.state.outputs.length > 0 && (
                            <div className="card margin-t-m padding-l">
                                <div className="card--header">
                                    <h2 className="card--header__title">Outputs</h2>
                                    <span className="card--header-count">
                                        {this.state.outputs.length}
                                    </span>
                                </div>
                                    {this.state.outputs.map((output, idx) => (
                                        <Output
                                            key={idx}
                                            index={idx + 1}
                                            output={output}
                                            outputId={this.state.outputIds
                                                    ? this.state.outputIds[output.outputIndex]
                                                    : ""}
                                        />
                                    ))}
                            </div>
                        )}

                    {this.state.outputs && this.state.outputs.length === 0 && (
                        <div className="card margin-t-m padding-l">
                            <h2 className="margin-b-s">Outputs</h2>
                            {this.state.outputs && this.state.outputs.length === 0 && (
                                <div className="card--value">
                                    There are no outputs for this address.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export default Address;
