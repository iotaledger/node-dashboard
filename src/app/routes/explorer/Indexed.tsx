import { Converter } from "@iota/util.js";
import classNames from "classnames";
import React, { ReactNode } from "react";
import { Link, RouteComponentProps } from "react-router-dom";
import { ReactComponent as ChevronLeftIcon } from "../../../assets/chevron-left.svg";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { TangleService } from "../../../services/tangleService";
import { ClipboardHelper } from "../../../utils/clipboardHelper";
import AsyncComponent from "../../components/layout/AsyncComponent";
import MessageButton from "../../components/layout/MessageButton";
import Spinner from "../../components/layout/Spinner";
import "./Indexed.scss";
import { IndexedRouteProps } from "./IndexedRouteProps";
import { IndexedState } from "./IndexedState";

/**
 * Component which will show the indexed page.
 */
class Indexed extends AsyncComponent<RouteComponentProps<IndexedRouteProps>, IndexedState> {
    /**
     * Service for tangle requests.
     */
    private readonly _tangleService: TangleService;

    /**
     * Create a new instance of Indexed.
     * @param props The props.
     */
    constructor(props: RouteComponentProps<IndexedRouteProps>) {
        super(props);

        this._tangleService = ServiceFactory.get<TangleService>("tangle");

        this.state = {
            statusBusy: true,
            status: "Loading indexed data..."
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        super.componentDidMount();

        const result = await this._tangleService.search(this.props.match.params.index);

        if (result?.indexMessageIds && result?.indexMessageType) {
            let hexIndex;
            let utf8Index;
            if (result.indexMessageType === "hex") {
                hexIndex = this.props.match.params.index;
                utf8Index = Converter.hexToUtf8(this.props.match.params.index);
            } else {
                hexIndex = Converter.utf8ToHex(this.props.match.params.index);
                utf8Index = this.props.match.params.index;
            }

            const matchHexIndex = hexIndex.match(/.{1,2}/g);
            const formattedHexIndex = matchHexIndex ? matchHexIndex.join(" ") : hexIndex;

            this.setState({
                messageIds: result.indexMessageIds,
                utf8Index,
                hexIndex: formattedHexIndex,
                indexLengthBytes: hexIndex.length / 2
            }, async () => {
                this.setState({
                    messages: [],
                    status: "",
                    statusBusy: false
                });
            });
        } else if (result?.unavailable) {
            this.props.history.replace("/explorer/unavailable");
        } else {
            this.props.history.replace(`/explorer/search/${this.props.match.params.index}`);
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="indexed">
                <div className="content">
                    <Link
                        to="/explorer"
                        className="row middle inline"
                    >
                        <ChevronLeftIcon className="secondary" />
                        <h3 className="secondary margin-l-s">Back to Explorer</h3>
                    </Link>
                    <div className="card margin-t-m padding-l">
                        <h2>Indexed Data</h2>
                        <div className="card--label row middle">
                            <span className="margin-r-t">Index UTF8 [{this.state.indexLengthBytes}]</span>
                            <MessageButton
                                onClick={() => ClipboardHelper.copy(
                                    this.state.utf8Index
                                )}
                                buttonType="copy"
                                labelPosition="right"
                            />
                        </div>
                        <div className="card--value">
                            {this.state.utf8Index}
                        </div>
                        <div className="card--label row middle">
                            <span className="margin-r-t">Index Hex [{this.state.indexLengthBytes}]</span>
                            <MessageButton
                                onClick={() => ClipboardHelper.copy(
                                    this.state.hexIndex?.replace(/ /g, "")
                                )}
                                buttonType="copy"
                                labelPosition="right"
                            />
                        </div>
                        <div className={classNames(
                            "card--value",
                            "card--value-textarea",
                            "card--value-textarea__hex",
                            "card--value-textarea__fit"
                        )}
                        >
                            {this.state.hexIndex}
                        </div>
                    </div>
                    <div className="card margin-t-m padding-l">
                        <div className="card--header row">
                            <h2 className="margin-b-s">Indexed Messages</h2>
                            {this.state.messageIds !== undefined && (
                                <span className="card--header-count">
                                    {this.state.messageIds.length}
                                </span>
                            )}
                        </div>

                        {this.state.statusBusy && (<Spinner />)}
                        {this.state.messageIds && this.state.messageIds.length === 0 && (
                            <div className="card--value">
                                There are no messages for this index.
                            </div>
                        )}
                        {this.state.messageIds && this.state.messageIds.length > 0 && (
                            <div className="col card--value">
                                {this.state.messageIds?.map((m, idx) => (
                                    <Link
                                        to={`/explorer/message/${m}`}
                                        key={idx}
                                        className="margin-b-s"
                                    >
                                        {m}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

export default Indexed;
