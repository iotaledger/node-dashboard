import { MILESTONE_PAYLOAD_TYPE, INDEXATION_PAYLOAD_TYPE, TRANSACTION_PAYLOAD_TYPE } from "@iota/iota.js";
import classNames from "classnames";
import React, { ChangeEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ReactComponent as UploadIcon } from "../../../assets/upload.svg";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { IPoi } from "../../../models/plugins/IPoi";
import { PluginService } from "../../../services/pluginService";
import { TangleService } from "../../../services/tangleService";
import { ClipboardHelper } from "../../../utils/clipboardHelper";
import { DataHelper } from "../../../utils/dataHelper";
import AsyncComponent from "../../components/layout/AsyncComponent";
import Spinner from "../../components/layout/Spinner";
import BlockButton from "../layout/BlockButton";
import IndexationPayload from "../tangle/IndexationPayload";
import MilestonePayload from "../tangle/MilestonePayload";
import TransactionPayload from "../tangle/TransactionPayload";
import { PoiState } from "./PoiState";

/**
 * Poi panel.
 */
class Poi extends AsyncComponent<unknown, PoiState> {
    /**
     * The title of the plugin.
     */
    private static readonly PLUGIN_TITLE = "Proof of inclusion";

    /**
     * The description of the plugin.
     */
    private static readonly PLUGIN_DESCRIPTION = "Validate proof of inclusion.";

    /**
     * The message for valid proof of inclusion.
     */
    private static readonly VALIDATION_SUCCESS_MESSAGE = "The given proof of inclusion for the message is valid.";

    /**
     * The messsage for invalid proof of inclusion.
     */
    private static readonly VALIDATION_FAILED_MESSAGE = "The given proof of inclusion for the message is invalid.";

    /**
     * Is the poi plugin available.
     */
    private static _isAvailable: boolean = false;

    /**
     * Service for plugin requests.
     */
    private readonly _pluginService: PluginService;

    /**
     * Create a new instance of Participation.
     * @param props The props.
     */
    constructor(props: unknown) {
        super(props);

        this._pluginService = ServiceFactory.get<PluginService>("plugin");

        this.state = {
            dialogBusy: false
        };
    }

    /**
     * Is the plugin available.
     */
    public static async initPlugin(): Promise<void> {
        Poi._isAvailable = false;
        const tangleService = ServiceFactory.get<TangleService>("tangle");

        try {
            const info = await tangleService.info();
            if (info.features.includes("POI")) {
                Poi._isAvailable = true;
            }
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * Get the plugin details if its availabe.
     * @returns The plugin details if available.
     */
    public static pluginDetails(): {
        title: string;
        description: string;
        settings: ReactNode;
    } | undefined {
        if (Poi._isAvailable) {
            return {
                title: Poi.PLUGIN_TITLE,
                description: Poi.PLUGIN_DESCRIPTION,
                settings: <Poi />
            };
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="poi">
                <div className="card padding-l">
                    <h2>{Poi.PLUGIN_TITLE}</h2>
                    <p className="margin-t-s">
                        {Poi.PLUGIN_DESCRIPTION}
                    </p>
                    <div className="card--label">
                        Upload poi json file
                    </div>
                    <div className="card--value row">
                        <div className="file-wrapper">
                            <input
                                type="file"
                                accept=".json"
                                className="padding-t"
                                onChange={async (event: ChangeEvent<HTMLInputElement>) => this.validate(event)}
                            />
                            <UploadIcon />
                        </div>
                        {this.state.dialogBusy && <Spinner />}
                    </div>
                    {this.state.dialogStatus && (
                        <React.Fragment>
                            <div className="card--label">
                                Proof of Inclusion
                            </div>
                            <div className="card--value row">
                                <div className="inclusion-state">
                                    <div
                                        className={
                                            classNames(
                                                "inclusion-state-pill",
                                                this.state.isPoiValid ? "inclusion__included" : "inclusion__conflicting"
                                            )
                                        }
                                    >
                                        {this.state.isPoiValid ? "Valid" : "Invalid"}
                                    </div>
                                    {this.state.dialogStatus}
                                </div>
                            </div>
                        </React.Fragment>
                    )}

                </div>
                {this.state.jsonData && (
                    <div className="content">
                        <div className="card margin-t-m padding-l">
                            <div className="row phone-down-column start">
                                <h2 className="margin-r-l">
                                    Message
                                </h2>
                            </div>
                            <div className="card--label">
                                Id
                            </div>
                            <div className="card--value card--value__mono row">
                                <Link
                                    className="margin-r-t"
                                    to={
                                        `/explorer/message/${this.state.txHash}`
                                    }
                                >
                                    {this.state.txHash}
                                </Link>
                                <BlockButton
                                    onClick={() => ClipboardHelper.copy(
                                        this.state.txHash
                                    )}
                                    buttonType="copy"
                                    labelPosition="top"
                                />
                            </div>
                            {this.state.jsonData.message.parentMessageIds?.map((parent, idx) => (
                                <React.Fragment key={idx}>
                                    <div className="card--label">
                                        Parent Message {idx + 1}
                                    </div>
                                    <div className="card--value card--value__mono row">
                                        {parent !== "0".repeat(64) && (
                                            <React.Fragment>
                                                <Link
                                                    className="margin-r-t"
                                                    to={
                                                        `/explorer/message/${parent}`
                                                    }
                                                >
                                                    {parent}
                                                </Link>
                                                <BlockButton
                                                    onClick={() => ClipboardHelper.copy(
                                                        parent
                                                    )}
                                                    buttonType="copy"
                                                    labelPosition="top"
                                                />
                                            </React.Fragment>
                                        )}
                                        {parent === "0".repeat(64) && (
                                            <span>Genesis</span>
                                        )}
                                    </div>
                                </React.Fragment>
                            ))}
                            <div className="card--label">
                                Nonce
                            </div>
                            <div className="card--value row">
                                <span className="margin-r-t">{this.state.jsonData.message?.nonce}</span>
                            </div>
                        </div>
                        {this.state.jsonData.message?.payload && (
                            <React.Fragment>
                                {this.state.jsonData.message.payload.type === TRANSACTION_PAYLOAD_TYPE && (
                                    <React.Fragment>
                                        <TransactionPayload payload={this.state.jsonData.message.payload} />
                                        {this.state.jsonData.message.payload.essence.payload && (
                                            <div className="card margin-t-m padding-l">
                                                <IndexationPayload
                                                    payload={this.state.jsonData.message.payload.essence.payload}
                                                />
                                            </div>
                                        )}
                                    </React.Fragment>
                                )}
                                {this.state.jsonData.message.payload.type === MILESTONE_PAYLOAD_TYPE && (
                                    <div className="card margin-t-m padding-l">
                                        <MilestonePayload payload={this.state.jsonData.message.payload} />
                                    </div>
                                )}
                                {this.state.jsonData.message.payload.type === INDEXATION_PAYLOAD_TYPE && (
                                    <div className="card margin-t-m padding-l">
                                        <IndexationPayload payload={this.state.jsonData.message.payload} />
                                    </div>
                                )}
                            </React.Fragment>
                        )}
                    </div>
                )}
            </div>
        );
    }

    /**
     *  Validate poi.
     * @param e File change event.
     */
    private async validate(e: ChangeEvent<HTMLInputElement>): Promise<void> {
        if (e.currentTarget.files?.[0]) {
            this.setState({
                jsonData: undefined,
                txHash: undefined,
                dialogBusy: true,
                dialogStatus: undefined,
                isPoiValid: false
            });
            const fileReader = new FileReader();

            fileReader.readAsText(e.currentTarget.files[0], "utf8");
            fileReader.addEventListener("load", (event: ProgressEvent<FileReader>) => {
                if (event?.target?.result) {
                    const poi = event.target.result as string;

                    try {
                        const payload: IPoi = JSON.parse(poi);

                        this.setState({
                            jsonData: payload,
                            txHash: DataHelper.calculateMessageId(payload.message)
                        });
                        this.setState({
                            dialogStatus: "Validating, please wait..."
                        }, async () => {
                            try {
                                const response = await this._pluginService.validatePoi(payload);
                                if (response) {
                                    this.setState({
                                        dialogBusy: false,
                                        dialogStatus: Poi.VALIDATION_SUCCESS_MESSAGE,
                                        isPoiValid: true
                                    });
                                } else {
                                    this.setState({
                                        dialogBusy: false,
                                        dialogStatus: Poi.VALIDATION_FAILED_MESSAGE,
                                        isPoiValid: false
                                    });
                                }
                            } catch (error) {
                                if (error instanceof Error) {
                                    this.setState({
                                        dialogBusy: false,
                                        dialogStatus: `Failed to validate the poi: ${error.message}.`,
                                        isPoiValid: false
                                    });
                                }
                            }
                        });
                    } catch (error) {
                        this.setState({
                            dialogBusy: false,
                            dialogStatus: `Invalid JSON object: ${error}.`,
                            isPoiValid: false
                        });
                    }
                }
            });
        }
    }
}

export default Poi;
