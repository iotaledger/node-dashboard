import { ALIAS_ADDRESS_TYPE, Bech32Helper, NFT_ADDRESS_TYPE, TransactionHelper } from "@iota/iota.js";
import React, { ReactNode } from "react";
import { Link, RouteComponentProps } from "react-router-dom";
import { ReactComponent as ChevronLeftIcon } from "../../../assets/chevron-left.svg";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { AssociationType, IAssociatedOutput } from "../../../models/tangle/IAssociatedOutputsResponse";
import { NodeConfigService } from "../../../services/nodeConfigService";
import { TangleService } from "../../../services/tangleService";
import { Bech32AddressHelper } from "../../../utils/bech32AddressHelper";
import { NameHelper } from "../../../utils/nameHelper";
import AsyncComponent from "../../components/layout/AsyncComponent";
import Bech32Address from "../../components/tangle/Bech32Address";
import Output from "../../components/tangle/Output";
import Outputs from "../../components/tangle/Outputs";
import "./Address.scss";
import { AddressProps } from "./AddressProps";
import { AddressState } from "./AddressState";

/**
 * Component which will show the address page.
 */
class Address extends AsyncComponent<RouteComponentProps<AddressProps>, AddressState> {
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
    constructor(props: RouteComponentProps<AddressProps>) {
        super(props);

        this._tangleService = ServiceFactory.get<TangleService>("tangle");

        const nodeConfigService = ServiceFactory.get<NodeConfigService>("node-config");
        this._bech32Hrp = nodeConfigService.getBech32Hrp();

        if (!Bech32Helper.matches(this.props.match.params.address, this._bech32Hrp)) {
            this.props.history.push(`/explorer/search/${this.props.match.params.address}`);
        }

        this.state = {
            address: { ...Bech32AddressHelper.buildAddress(props.match.params.address, this._bech32Hrp) },
            outputs: [],
            basicOutputs: [],
            nftOutputs: [],
            aliasOutputs: [],
            statusBusyBasic: false,
            statusBusyNft: false,
            statusBusyAlias: false
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        super.componentDidMount();

        if (this.state.address?.type === NFT_ADDRESS_TYPE && this.state.address.hex) {
            const nft = await this._tangleService.nftDetails(this.state.address.hex);
            this.setState({ nft });
        }

        if (this.state.address?.type === ALIAS_ADDRESS_TYPE && this.state.address.hex) {
            const alias = await this._tangleService.aliasDetails(this.state.address.hex);
            this.setState({ alias });
        }

        const associatedOutputs = await this._tangleService.getOutputsForAddress(this.props.match.params.address);

        if (associatedOutputs.length > 0) {
            const sortedResults = associatedOutputs.sort((a, b) => (
                 ((a.association || a.association === 0) && (b.association || b.association === 0))
                 ? a.association - b.association
                 : -1
            ));

            const outputs: IAssociatedOutput[] = [
                /* eslint-disable-next-line unicorn/no-array-reduce */
                ...sortedResults.reduce((outputsMap, output) =>
                (outputsMap.has(output.outputId) ? outputsMap : outputsMap.set(output.outputId, output)),
                new Map()).values()
            ];

            const basicOutputs = outputs.filter(output =>
                ((output.association || output.association === 0)
                ? [
                    AssociationType.BASIC_OUTPUT,
                    AssociationType.BASIC_SENDER,
                    AssociationType.BASIC_EXPIRATION_RETURN,
                    AssociationType.BASIC_STORAGE_RETURN
                ].includes(output.association)
                : false));

            const nftOutputs = outputs.filter(output => (output.association
                ? [
                    AssociationType.NFT_OUTPUT,
                    AssociationType.NFT_STORAGE_RETURN,
                    AssociationType.NFT_EXPIRATION_RETURN,
                    AssociationType.NFT_SENDER
                ].includes(output.association)
                : false));

            const aliasOutputs = outputs.filter(output => (output.association
                ? [
                    AssociationType.ALIAS_STATE_CONTROLLER,
                    AssociationType.ALIAS_GOVERNOR,
                    AssociationType.ALIAS_ISSUER,
                    AssociationType.ALIAS_SENDER,
                    AssociationType.FOUNDRY_ALIAS
                ].includes(output.association)
                : false));

            this.setState({
                outputs,
                basicOutputs,
                nftOutputs,
                aliasOutputs
            });
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
                            <h2> {this.state.address?.type
                                ? NameHelper.getAddressTypeName(this.state.address.type)
                                : "Address"}
                            </h2>
                            {this.state.address?.bech32 && (
                                <Bech32Address
                                    activeLinks={false}
                                    showHexAddress={true}
                                    addressDetails={this.state.address}
                                />
                            )}
                            {this.state.nft && (
                                <Output
                                    showDetails={true}
                                    outputId={TransactionHelper.outputIdFromTransactionData(
                                        this.state.nft.metadata.transactionId, this.state.nft.metadata.outputIndex)}
                                    output={this.state.nft.output}
                                    metadata={this.state.nft.metadata}
                                />
                            )}
                            {this.state.alias && (
                                <Output
                                    showDetails={true}
                                    outputId={TransactionHelper.outputIdFromTransactionData(
                                        this.state.alias.metadata.transactionId, this.state.alias.metadata.outputIndex)}
                                    output={this.state.alias.output}
                                    metadata={this.state.alias.metadata}
                                />
                            )}
                        </div>
                    </div>
                    {this.state.basicOutputs.length > 0 && (
                        <Outputs
                            outputs={this.state.basicOutputs}
                            currentPage={1}
                            pageSize={10}
                            extraPageRangeLimit={20}
                            siblingsCount={1}
                            statusBusy={this.state.statusBusyBasic}
                            title="Outputs"
                            onPageChange={(page: number, firstPageIndex: number, lastPageIndex: number) => {
                                if (this.state.outputs.length > 0) {
                                    this.updateOutputDetails(
                                        "basicOutputs",
                                        "statusBusyBasic",
                                        firstPageIndex,
                                        lastPageIndex
                                    ).catch(err => console.error(err));
                                }
                            }}
                        />
                    )}
                    {this.state.nftOutputs.length > 0 && (
                        <Outputs
                            outputs={this.state.nftOutputs}
                            currentPage={1}
                            pageSize={10}
                            extraPageRangeLimit={20}
                            siblingsCount={1}
                            statusBusy={this.state.statusBusyNft}
                            title="Nft Outputs"
                            onPageChange={(page: number, firstPageIndex: number, lastPageIndex: number) => {
                                if (this.state.outputs.length > 0) {
                                    this.updateOutputDetails(
                                        "nftOutputs",
                                        "statusBusyNft",
                                        firstPageIndex,
                                        lastPageIndex
                                    ).catch(err => console.error(err));
                                }
                            }}
                        />
                    )}
                    {this.state.aliasOutputs.length > 0 && (
                        <Outputs
                            outputs={this.state.aliasOutputs}
                            currentPage={1}
                            pageSize={10}
                            extraPageRangeLimit={20}
                            siblingsCount={1}
                            statusBusy={this.state.statusBusyAlias}
                            title="Alias Outputs"
                            onPageChange={(page: number, firstPageIndex: number, lastPageIndex: number) => {
                                if (this.state.outputs.length > 0) {
                                    this.updateOutputDetails(
                                        "aliasOutputs",
                                        "statusBusyAlias",
                                        firstPageIndex,
                                        lastPageIndex
                                    ).catch(err => console.error(err));
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
     * @param outputsKey The key the outputs array to update.
     * @param busyKey The Keyof the status busy boolean variable.
     * @param startIndex The start index of the output.
     * @param endIndex The end index of the output.
     */
    private async updateOutputDetails(
        outputsKey: keyof AddressState,
        busyKey: keyof AddressState,
        startIndex: number,
        endIndex: number) {
        const outputs = this.state[outputsKey] as IAssociatedOutput[];
        if (outputs.length > 0) {
            this.setState(prevState => ({
                ...prevState,
                [busyKey]: true
            }));
            for (let i = startIndex; i < endIndex; i++) {
                const outputResult = await this._tangleService.outputDetails(outputs[i].outputId);

                if (outputResult) {
                    outputs[i].outputDetails = outputResult;
                    this.setState(prevState => ({
                        ...prevState,
                        [outputsKey]: outputs
                    }));
                }
            }

            this.setState(prevState => ({
                ...prevState,
                [busyKey]: false
            }));
        }
    }
}

export default Address;
