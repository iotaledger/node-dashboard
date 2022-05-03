import { Blake2b } from "@iota/crypto.js";
import { serializeMessage } from "@iota/iota.js";
import { Converter, WriteStream } from "@iota/util.js";
import React, { ReactNode } from "react";
import { Link, Redirect, RouteComponentProps } from "react-router-dom";
import { ReactComponent as ChevronLeftIcon } from "../../assets/chevron-left.svg";
import { ServiceFactory } from "../../factories/serviceFactory";
import { TangleService } from "../../services/tangleService";
import AsyncComponent from "../components/layout/AsyncComponent";
import Spinner from "../components/layout/Spinner";
import "./Search.scss";
import { SearchRouteProps } from "./SearchRouteProps";
import { SearchState } from "./SearchState";

/**
 * Component which will show the search page.
 */
class Search extends AsyncComponent<RouteComponentProps<SearchRouteProps>, SearchState> {
    /**
     * Create a new instance of Search.
     * @param props The props.
     */
    constructor(props: RouteComponentProps<SearchRouteProps>) {
        super(props);

        this.state = {
            statusBusy: true,
            redirect: "",
            error: ""
        };
    }

    /**
     * The component mounted.
     */
    public componentDidMount(): void {
        super.componentDidMount();
        this.trySearch();
    }

    /**
     * The component was updated.
     * @param prevProps The previous properties.
     */
    public componentDidUpdate(prevProps: RouteComponentProps<SearchRouteProps>): void {
        if (this.props.location.pathname !== prevProps.location.pathname) {
            this.trySearch();
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return this.state.redirect.length > 0 ? (
            <Redirect to={this.state.redirect} />
        )
            : (
                <div className="search">
                    <div className="content">
                        <Link
                            to="/explorer"
                            className="row middle inline"
                        >
                            <ChevronLeftIcon className="secondary" />
                            <h3 className="secondary margin-l-s">Back to Explorer</h3>
                        </Link>

                        <div className="card margin-t-m padding-l">
                            <h2 className="margin-b-m">Search</h2>
                            {this.state.statusBusy && (<Spinner />)}
                            {!this.state.statusBusy && (
                                <React.Fragment>
                                    {this.state.error && (
                                        <p className="danger">
                                            {this.state.error}
                                        </p>
                                    )}
                                    <br />
                                    <p>Please try again with your query in one of the following formats:</p>
                                    <br />
                                    <ul>
                                        <li>
                                            <span>Messages</span>
                                            <span>64 Hex characters</span>
                                        </li>
                                        <li>
                                            <span>Message using Transaction Id</span>
                                            <span>64 Hex characters</span>
                                        </li>
                                        <li>
                                            <span>Addresses</span>
                                            <span>64 Hex characters or Bech32 Format</span>
                                        </li>
                                        <li>
                                            <span>Nft/Alias Addresses</span>
                                            <span>40 Hex characters or Bech32 Format</span>
                                        </li>
                                        <li>
                                            <span>Outputs</span>
                                            <span>68 Hex characters or tag</span>
                                        </li>
                                        <li>
                                            <span>Foundry Id</span>
                                            <span>52 Hex characters</span>
                                        </li>
                                        <li>
                                            <span>Token Id</span>
                                            <span>76 Hex characters</span>
                                        </li>
                                        <li>
                                            <span>Milestone Index</span>
                                            <span>Numeric</span>
                                        </li>
                                    </ul>
                                </React.Fragment>
                            )}
                        </div>
                    </div>
                </div>
            );
    }

    /**
     * Update the state of the component.
     */
    private trySearch(): void {
        const query = (this.props.match.params.query ?? "").trim();

        if (query.length > 0) {
            this.setState({ statusBusy: true }, async () => {
                const tangleService = ServiceFactory.get<TangleService>("tangle");
                const response = await tangleService.search(query);

                let redirect = "";

                if (response) {
                    if (response.unavailable) {
                        redirect = "/explorer/unavailable";
                    } else {
                        let objType;
                        let objParam = query;

                        if (response.message) {
                            objType = "message";
                            // Recalculate the message id from the content, in case
                            // the lookup was a response to a transaction id lookup
                            const writeStream = new WriteStream();

                            try {
                                serializeMessage(writeStream, response.message);
                            } catch (error) {
                                if (error instanceof Error) {
                                    console.log(error.message);
                                }
                            }
                            objParam = Converter.bytesToHex(Blake2b.sum256(writeStream.finalBytes()), true);
                        } else if (response?.address) {
                            objType = "address";
                        } else if (response.output) {
                            objType = "message";
                            objParam = response.output.messageId;
                        } else if (response.milestone) {
                            objType = "milestone";
                            objParam = response.milestone.index.toString();
                        }
                        if (objType) {
                            redirect = `/explorer/${objType}/${objParam}`;
                        }
                    }
                }

                this.setState({
                    error: redirect.length > 0 ? "" : "Nothing could be found for the search.",
                    statusBusy: false,
                    redirect
                });
            });
        } else {
            this.setState({
                statusBusy: false,
                error: "The search is empty."
            });
        }
    }
}

export default Search;
