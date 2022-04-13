import { Blake2b } from "@iota/crypto.js";
import { serializeMessage, deserializeMessage, IMessage, ADDRESS_UNLOCK_CONDITION_TYPE } from "@iota/iota.js";
import { Converter, WriteStream, ReadStream } from "@iota/util.js";
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
                                            <span>Outputs</span>
                                            <span>68 Hex characters</span>
                                        </li>
                                        <li>
                                            <span>Milestone Index</span>
                                            <span>Numeric</span>
                                        </li>
                                        <li>
                                            <span>Indexes</span>
                                            <span>Maximum 64 UTF-8 chars or maximum 128 hex chars</span>
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
                            console.log("message");
                            console.log(response.message);
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
                            // console.log("writeStream.finalHex()")
                            // console.log(writeStream.finalHex())
                            objParam = Converter.bytesToHex(Blake2b.sum256(writeStream.finalBytes()), true);
                            // console.log(objParam);
                            // let rs = new ReadStream(writeStream.finalBytes())
            //                 const hex =
            // "020239210d349a33c361bf98ada707663f3f7da71ffff1531c58c1c5c770a60c4223c2f5cc3f1161b74e84a5afc9f4739ab51d0d01c3786334a1877436a3c2cc9ebda101000007000000300401000dad4e62000000000239210d349a33c361bf98ada707663f3f7da71ffff1531c58c1c5c770a60c4223c2f5cc3f1161b74e84a5afc9f4739ab51d0d01c3786334a1877436a3c2cc9ebd0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a80000000000000000000000000300d85e5b1590d898d1e0cdebb2e3b5337c8b76270142663d78811683ba47c17c9815188080d5ef2f8a8fd08498243a30b2a8eb08e0910573101632bb244c9e27db26121c8af619d90de6cb5e5c407e4edd709e0e06702170e311a1668e0a12480d00d9922819a39e94ddf3907f4b9c8df93f39f026244fcb609205b9a879022599f248afb8e21fbba0ba473b6798ecad3a33e10d1575fd5e3822e2922db4cc24b0808fd6792ee6eaaade15cdc14e43da16883962d15358dc064ba5bb2726cf07790a00f9d9656a60049083eef61487632187b351294c1fa23d118060d813db6d03e8b6105c244d6cd7d831d7f661e985fed1461cdda0ef48e9b973015aa1e28ff1cdd1089f910789cccaeeb24c74b17a36d9777199056d54fea8d28c1e16abee4b710c8038aeaaaaaaaaaa";
            //                 let rs = new ReadStream(Converter.hexToBytes(hex))
            //                 let de = deserializeMessage(rs)
            //                 console.log("deserialize")
            //                 console.log(JSON.stringify(de))
                        } else if (response?.address) {
                            objType = "address";
                        } else if (response.indexMessageIds) {
                            objType = "indexed";
                        } else if (response.output) {
                            objType = "message";
                            objParam = response.output.messageId;
                        } else if (response.milestone) {
                            objType = "milestone";
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
