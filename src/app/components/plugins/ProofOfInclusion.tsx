import { MILESTONE_PAYLOAD_TYPE, TAGGED_DATA_PAYLOAD_TYPE, TransactionHelper, TRANSACTION_PAYLOAD_TYPE } from "@iota/iota.js";
import classNames from "classnames";
import React, { ChangeEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ReactComponent as UploadIcon } from "../../../assets/upload.svg";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { IProofOfInclusion } from "../../../models/plugins/IProofOfInclusion";
import { PluginService } from "../../../services/pluginService";
import { TangleService } from "../../../services/tangleService";
import { ClipboardHelper } from "../../../utils/clipboardHelper";
import AsyncComponent from "../layout/AsyncComponent";
import BlockButton from "../layout/BlockButton";
import Spinner from "../layout/Spinner";
import MilestonePayload from "../tangle/MilestonePayload";
import TaggedDataPayload from "../tangle/TaggedDataPayload";
import TransactionPayload from "../tangle/TransactionPayload";
import { ProofOfInclusionState } from "./ProofOfInclusionState";

/**
 * ProofOfInclusion panel.
 */
class ProofOfInclusion extends AsyncComponent<unknown, ProofOfInclusionState> {
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
    private static readonly VALIDATION_SUCCESS_MESSAGE = "The given proof of inclusion for the block is valid.";

    /**
     * The messsage for invalid proof of inclusion.
     */
    private static readonly VALIDATION_FAILED_MESSAGE = "The given proof of inclusion for the block is invalid.";

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
        ProofOfInclusion._isAvailable = false;
        const tangleService = ServiceFactory.get<TangleService>("tangle");

        try {
            const routes = await tangleService.routes();
            if (routes.routes.includes("poi/v1")) {
                ProofOfInclusion._isAvailable = true;
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
        if (ProofOfInclusion._isAvailable) {
            return {
                title: ProofOfInclusion.PLUGIN_TITLE,
                description: ProofOfInclusion.PLUGIN_DESCRIPTION,
                settings: <ProofOfInclusion />
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
                    <h2>{ProofOfInclusion.PLUGIN_TITLE}</h2>
                    <p className="margin-t-s">
                        {ProofOfInclusion.PLUGIN_DESCRIPTION}
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
                {this.state.poi && (
                    <div className="content">
                        <div className="card margin-t-m padding-l">
                            <div className="row phone-down-column start">
                                <h2 className="margin-r-l">
                                    Block
                                </h2>
                            </div>
                            <div className="card--label">
                                Id
                            </div>
                            <div className="card--value card--value__mono row">
                                <Link
                                    className="margin-r-t"
                                    to={
                                        `/explorer/block/${this.state.blockId}`
                                    }
                                >
                                    {this.state.blockId}
                                </Link>
                                <BlockButton
                                    onClick={() => ClipboardHelper.copy(
                                        this.state.blockId
                                    )}
                                    buttonType="copy"
                                    labelPosition="top"
                                />
                            </div>
                            {this.state.poi.block.parents.map((parent, idx) => (
                                <React.Fragment key={idx}>
                                    <div className="card--label">
                                        Parent Block {idx + 1}
                                    </div>
                                    <div className="card--value card--value__mono row">
                                        {parent !== "0".repeat(64) && (
                                            <React.Fragment>
                                                <Link
                                                    className="margin-r-t"
                                                    to={
                                                        `/explorer/block/${parent}`
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
                                <span className="margin-r-t">{this.state.poi.block?.nonce}</span>
                            </div>
                        </div>
                        {this.state.poi.block?.payload && (
                            <React.Fragment>
                                {this.state.poi.block.payload.type === TRANSACTION_PAYLOAD_TYPE && (
                                    <React.Fragment>
                                        <TransactionPayload payload={this.state.poi.block.payload} />
                                        {this.state.poi.block.payload.essence.payload && (
                                            <div className="card margin-t-m padding-l">
                                                <TaggedDataPayload
                                                    payload={this.state.poi.block.payload.essence.payload}
                                                />
                                            </div>
                                        )}
                                    </React.Fragment>
                                )}
                                {this.state.poi.block.payload.type === MILESTONE_PAYLOAD_TYPE && (
                                    <div className="card margin-t-m padding-l">
                                        <MilestonePayload payload={this.state.poi.block.payload} />
                                    </div>
                                )}
                                {this.state.poi.block.payload.type === TAGGED_DATA_PAYLOAD_TYPE && (
                                    <div className="card margin-t-m padding-l">
                                        <TaggedDataPayload payload={this.state.poi.block.payload} />
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
                poi: undefined,
                blockId: undefined,
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
                        const payload: IProofOfInclusion = JSON.parse(poi);

                        this.setState({
                            poi: payload,
                            blockId: TransactionHelper.calculateBlockId(payload.block)
                        });
                        this.setState({
                            dialogStatus: "Validating, please wait..."
                        }, async () => {
                            try {
                                const response = await this._pluginService.validatePoi(payload);
                                    if (response) {
                                        this.setState({
                                            dialogBusy: false,
                                            dialogStatus: ProofOfInclusion.VALIDATION_SUCCESS_MESSAGE,
                                            isPoiValid: true
                                        });
                                    } else {
                                        this.setState({
                                            dialogBusy: false,
                                            dialogStatus: ProofOfInclusion.VALIDATION_FAILED_MESSAGE,
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

export default ProofOfInclusion;
