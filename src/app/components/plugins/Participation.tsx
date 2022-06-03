import classNames from "classnames";
import React, { ReactNode } from "react";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { IParticipationEvent } from "../../../models/plugins/participation/IParticipationEvent";
import { IParticipationEventInfo } from "../../../models/plugins/participation/IParticipationEventInfo";
import { IParticipationEvents } from "../../../models/plugins/participation/IParticipationEvents";
import { IParticipationEventStatus } from "../../../models/plugins/participation/IParticipationEventStatus";
import { AuthService } from "../../../services/authService";
import { TangleService } from "../../../services/tangleService";
import { FetchHelper } from "../../../utils/fetchHelper";
import AsyncComponent from "../../components/layout/AsyncComponent";
import Dialog from "../../components/layout/Dialog";
import Spinner from "../../components/layout/Spinner";
import "./Participation.scss";
import { IParticipationEventAnswer } from "./../../../models/plugins/participation/IParticipationEventAnswer";
import { IParticipationEventQuestion } from "./../../../models/plugins/participation/IParticipationEventQuestion";
import { ParticipationState } from "./ParticipationState";

/**
 * Participation panel.
 */
class Participation extends AsyncComponent<unknown, ParticipationState> {
    /**
     * The title of the plugin.
     */
    private static readonly PLUGIN_TITLE = "Participation";

    /**
     * The description of the plugin.
     */
    private static readonly PLUGIN_DESCRIPTION = "Manage on-tangle ballots and staking events tracked by the node.";

    /**
     * Is the participation plugin available.
     */
    private static _isAvailable: boolean = false;

    /**
     * Create a new instance of Participation.
     * @param props The props.
     */
    constructor(props: unknown) {
        super(props);

        this.state = {
            events: {},
            eventIds: [],
            eventInfo: ""
        };
    }

    /**
     * Is the plugin available.
     */
    public static async initPlugin(): Promise<void> {
        Participation._isAvailable = false;
        const tangleService = ServiceFactory.get<TangleService>("tangle");

        try {
            const info = await tangleService.info();
            if (info.plugins.includes("participation/v1")) {
                Participation._isAvailable = true;
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
        if (Participation._isAvailable) {
            return {
                title: Participation.PLUGIN_TITLE,
                description: Participation.PLUGIN_DESCRIPTION,
                settings: <Participation />
            };
        }
    }

    /**
     * Build authentication headers.
     * @returns The authentication headers.
     */
    private static buildAuthHeaders(): Record<string, string> {
        const authService = ServiceFactory.get<AuthService>("auth");

        const headers: Record<string, string> = {};
        const jwt = authService.isLoggedIn();
        if (jwt) {
            headers.Authorization = `Bearer ${jwt}`;
        }
        const csrf = authService.csrf();
        if (csrf) {
            headers["X-CSRF-Token"] = csrf;
        }

        return headers;
    }

    /**
     * The component did mount.
     */
    public async componentDidMount(): Promise<void> {
        super.componentDidMount();

        await this.fetchEvents();
    }

    /**
     * The component updated.
     * @param prevProps The previous properties.
     * @param prevState The previous state.
     */
    public async componentDidUpdate(prevProps: unknown, prevState: ParticipationState): Promise<void> {
        if (this.state.eventIds !== prevState.eventIds) {
            const difference = this.state.eventIds.filter(e => !prevState.eventIds.includes(e));
            for (const id of difference) {
                await this.fetchEventInfo(id);
                await this.fetchEventStatus(id);
            }
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="participation">
                <div className="content">
                    <div className="row end">
                        <button
                            type="button"
                            className="add-button"
                            onClick={() => this.setState({
                                    dialogType: "add",
                                    dialogStatus: "",
                                    dialogBusy: false
                                })}
                        >
                            Add Event
                        </button>
                    </div>
                    <div className="events-panel">
                        {this.state.eventIds.length === 0 && (
                            <p className="margin-t-s">There are no events.</p>
                        )}
                        {this.state.eventIds.map((e, idx) => {
                            const eventInfo = this.state.events[e];
                            return (
                                <div className="events-panel--item" key={idx}>
                                    <div className="card col padding-m">
                                        <div className="col">
                                            <div className="event-id word-break-all margin-b-s">
                                                <span><h4>ID</h4> {e}</span>
                                            </div>
                                            <div className="event-item event-item--stretch">
                                                <h4>Name</h4>
                                                <div className="event-value word-break-all">
                                                    {eventInfo?.name}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row wrap">
                                            <div className="event-item">
                                                <h4>Milestone index commence</h4>
                                                <div className="event-value word-break-all">
                                                    {eventInfo?.milestoneIndexCommence}
                                                </div>
                                            </div>
                                            <div className="event-item">
                                                <h4>Milestone index start</h4>
                                                <div className="event-value word-break-all">
                                                    {eventInfo?.milestoneIndexStart}
                                                </div>
                                            </div>
                                            <div className="event-item">
                                                <h4>Milestone index end</h4>
                                                <div className="event-value word-break-all">
                                                    {eventInfo?.milestoneIndexEnd}
                                                </div>
                                            </div>
                                            <div className="event-item">
                                                <h4>Type</h4>
                                                <div className="event-value word-break-all">
                                                    {eventInfo?.payload.type === 0 ? "Ballot" : "Staking"}
                                                </div>
                                            </div>
                                            <div className="event-item">
                                                <h4>Status</h4>
                                                <div className="event-value word-break-all">
                                                    {eventInfo?.status?.status
                                                    .slice(0, 1).toUpperCase()}{eventInfo?.status?.status.slice(1)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row event-actions">
                                            <button
                                                type="button"
                                                className="card--action card--action margin-t-s margin-r-s"
                                                onClick={() => this.setState({
                                                    dialogType: "details",
                                                    dialogStatus: "",
                                                    dialogBusy: false,
                                                    dialogDetailsEvent: this.state.events[e]
                                                })}
                                            >
                                                More details
                                            </button>
                                            <button
                                                type="button"
                                                className="card--action card--action-danger margin-t-s"
                                                onClick={() => this.setState({
                                                    dialogType: "delete",
                                                    dialogStatus: "",
                                                    dialogBusy: false,
                                                    deleteId: e
                                                })}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {this.state.dialogType && (
                        <Dialog
                            title={{
                                "add": "Add Event",
                                "delete": "Delete Event",
                                "details": "Event details"
                            }[this.state.dialogType]}
                            actions={[
                                <button
                                    className={(this.state.dialogType === "details") ? "d-none" : ""}
                                    type="button"
                                    onClick={async () => {
                                            if (this.state.dialogType === "add") {
                                               await this.submitEvent();
                                            } else if (this.state.deleteId) {
                                               await this.eventDelete(this.state.deleteId);
                                            }
                                        }}
                                    key={0}
                                    disabled={this.state.dialogBusy || (
                                        this.state.dialogType === "add" &&
                                        (!this.state.eventInfo ||
                                        this.state.eventInfo.trim().length === 0 ||
                                        !this.validateJsonOrUrl(this.state?.eventInfo))
                                    )}
                                >
                                    {this.state.dialogType === "add" ? "OK" : "Yes"}
                                </button>,
                                <button
                                    type="button"
                                    onClick={() => this.setState({
                                        dialogType: undefined,
                                        deleteId: undefined,
                                        dialogDetailsEvent: undefined
                                    })}
                                    key={1}
                                    disabled={this.state.dialogBusy}
                                >
                                    {(this.state.dialogType === "add" ||
                                    this.state.dialogType === "details") ? "Cancel" : "No"}
                                </button>
                            ]}
                        >
                            {this.state.dialogType === "delete" && (
                                <p className="margin-b-l">
                                    {`Are you sure you want to delete the event 
                                    ${(this.state.deleteId)
                                    ? this.state.events[this.state.deleteId].name : ""}?`}
                                </p>
                            )}
                            {(this.state.dialogType === "details" && this.state.dialogDetailsEvent) && (
                                <div className="row wrap">
                                    <div className="event-item">
                                        <h4>Milestone index</h4>
                                        <div className="event-value word-break-all">
                                            {this.state.dialogDetailsEvent.status?.milestoneIndex}
                                        </div>
                                    </div>
                                    <div className="event-item">
                                        <h4>Status</h4>
                                        <div className="event-value word-break-all">
                                            {this.state.dialogDetailsEvent.status?.status
                                            .slice(0, 1).toUpperCase()}
                                            {this.state.dialogDetailsEvent.status?.status.slice(1)}
                                        </div>
                                    </div>
                                    {/* Ballot */}
                                    {this.state.dialogDetailsEvent.payload.type === 0 && (
                                        <div>
                                            {this.state.dialogDetailsEvent.payload.questions
                                            ?.map((q: IParticipationEventQuestion, idx: number) => (
                                                <div className="event-item--highlight margin-b-s" key={idx}>
                                                    <div className="event-item event-item--stretch">
                                                        <h4>Question</h4>
                                                        <div className="event-value word-break-all">
                                                            {q.text}
                                                        </div>
                                                    </div>

                                                    {q.answers.map((a: IParticipationEventAnswer, idy) => (
                                                        <div className="row wrap" key={idy}>
                                                            <div className="event-item event-item--small">
                                                                <h4>Answer</h4>
                                                                <div className="event-value word-break-all">
                                                                    {a.text}
                                                                </div>
                                                            </div>
                                                            <div className="event-item event-item--small">
                                                                <h4>current</h4>
                                                                <div className="event-value word-break-all">
                                                                    {(this.state.dialogDetailsEvent?.status?.questions)
                                                                    ? this.state.dialogDetailsEvent.status
                                                                    .questions[idx].answers[idy].current : "" }
                                                                </div>
                                                            </div>
                                                            <div className="event-item event-item--small">
                                                                <h4>accumulated</h4>
                                                                <div className="event-value word-break-all">
                                                                    {(this.state.dialogDetailsEvent?.status?.questions)
                                                                    ? this.state.dialogDetailsEvent.status
                                                                    .questions[idx].answers[idy].accumulated : ""}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {/* Staking */}
                                    {this.state.dialogDetailsEvent.payload.type === 1 && (
                                        <div className="row event-item--highlight margin-b-s">
                                            <div className="event-item event-item--small">
                                                <h4>Symbol</h4>
                                                <div className="event-value word-break-all">
                                                    {this.state.dialogDetailsEvent.status?.staking?.symbol}
                                                </div>
                                            </div>
                                            <div className="event-item event-item--small">
                                                <h4>Staked</h4>
                                                <div className="event-value word-break-all">
                                                    {this.state.dialogDetailsEvent.status?.staking?.staked}
                                                </div>
                                            </div>
                                            <div className="event-item event-item--small">
                                                <h4>Rewarded</h4>
                                                <div className="event-value word-break-all">
                                                    {this.state.dialogDetailsEvent.status?.staking?.rewarded}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {this.state.dialogType === "add" && (
                                <React.Fragment>
                                    <p>Please enter the details of the event to {this.state.dialogType}.</p>

                                    <div className="dialog--label">
                                        JSON Configuration or URL
                                    </div>
                                    <div className="dialog--value">
                                        <textarea
                                            className="textarea--stretch
                                            dialog--value-textarea
                                            dialog--value-textarea__json"
                                            placeholder='e.g. { "name":"Example event title"... } or http://example.com'
                                            value={this.state.eventInfo}
                                            disabled={this.state.dialogBusy}
                                            onChange={e => this.setState({ eventInfo: e.target.value })}
                                        />
                                        {this.state.eventInfo && !this.validateJsonOrUrl(this.state.eventInfo) && (
                                        <span className="validation--error">Not a valid JSON or URL</span>
                                        )}
                                    </div>
                                </React.Fragment>
                            )}
                            {this.state.dialogBusy && <Spinner />}
                            <p className={
                                classNames(
                                    "margin-t-l",
                                    { "danger": !this.state.dialogBusy }
                                )
                            }
                            >
                                {this.state.dialogStatus}
                            </p>
                        </Dialog>
                    )}
                </div>
            </div>
        );
    }

    /**
     * Get Participation Events.
     */
    private async fetchEvents(): Promise<void> {
        try {
            const response = await FetchHelper.json<unknown, IParticipationEvents>(
                `${window.location.protocol}//${window.location.host}`,
                "/api/plugins/participation/v1/events",
                "get",
                undefined,
                Participation.buildAuthHeaders());

            if (response?.eventIds) {
                this.setState({
                    eventIds: response.eventIds
                });
            } else {
                console.log(response.error);
            }
        } catch (err) {
            console.log(err);
        }
    }

    /**
     *  Get the event information as a JSON payload.
     * @param id Event id
     */
    private async fetchEventInfo(id: string): Promise<void> {
        try {
            const response = await FetchHelper.json<unknown, IParticipationEventInfo>(
                `${window.location.protocol}//${window.location.host}`,
                `/api/plugins/participation/v1/events/${id}`,
                "get",
                undefined,
                Participation.buildAuthHeaders());

            if (!response?.error) {
                this.setState(prevState => ({
                    events: {
                        ...prevState.events,
                        [id]: response
                    }
                }));
            } else {
                console.log(response.error);
            }
        } catch (err) {
            console.log(err);
        }
    }

    /**
     *  Get the event status info as a JSON payload.
     * @param id Event id
     */
    private async fetchEventStatus(id: string): Promise<void> {
        try {
            const response = await FetchHelper.json<unknown, IParticipationEventStatus>(
                `${window.location.protocol}//${window.location.host}`,
                `/api/plugins/participation/v1/events/${id}/status`,
                "get",
                undefined,
                Participation.buildAuthHeaders());

            if (!response?.error) {
                if (this.state.events[id]) {
                    this.setState(prevState => ({
                        ...prevState,
                        events: {
                            ...prevState.events,
                            [id]: {
                                ...prevState.events[id],
                                status: response
                            }
                        }
                    }));
                }
            } else {
                console.log(response.error);
            }
        } catch (err) {
            console.log(err);
        }
    }

    /**
     *  Submit event to be added.
     */
    private async submitEvent(): Promise<void> {
        if (this.state.eventInfo) {
            try {
                await this.eventAdd(JSON.parse(this.state.eventInfo) as IParticipationEventInfo);
            } catch {
                try {
                    const url = new URL(this.state.eventInfo);
                    const config = await this.fetchEventJsonConfig(url);

                    if (config) {
                        await this.eventAdd(config);
                    }
                } catch (error) {
                    if (error instanceof Error) {
                        this.setState({
                            dialogBusy: false,
                            dialogStatus: `Failed to add event: ${error.message}`
                        });
                    }
                }
            }
        }
    }

    /**
     *  Add new Event.
     * @param eventInfo JSON string that contains the event info that is to be added.
     */
    private async eventAdd(eventInfo: IParticipationEventInfo): Promise<void> {
        this.setState({
            dialogBusy: true,
            dialogStatus: "Adding event, please wait..."
        }, async () => {
            try {
                const response = await FetchHelper.json<unknown, IParticipationEvent>(
                    `${window.location.protocol}//${window.location.host}`,
                    "/api/plugins/participation/v1/admin/events",
                    "post",
                    eventInfo,
                    Participation.buildAuthHeaders());

                if (response.eventId) {
                    const id = response.eventId;
                    this.setState(prevState => ({
                        eventIds: [
                            id,
                            ...prevState.eventIds
                        ],
                        dialogBusy: false,
                        dialogStatus: "",
                        dialogType: undefined,
                        eventInfo: undefined
                    }));
                } else {
                    this.setState({
                        dialogBusy: false,
                        dialogStatus: `Failed to add event: ${response.error?.message}`
                    });
                }
            } catch (error) {
                if (error instanceof Error) {
                    this.setState({
                        dialogBusy: false,
                        dialogStatus: `Failed to add event: ${error.message}`
                    });
                }
            }
        });
    }

    /**
     *  Delete event.
     * @param eventId The Id of the event to delete
     */
    private async eventDelete(eventId: string): Promise<void> {
        this.setState({
            dialogBusy: true,
            dialogStatus: "Deleting event, please wait..."
        }, async () => {
            try {
                const response = await FetchHelper.json<unknown, {
                    error?: {
                        message: string;
                    };
                }>(
                    `${window.location.protocol}//${window.location.host}`,
                    `/api/plugins/participation/v1/admin/events/${eventId}`,
                    "delete",
                    undefined,
                    Participation.buildAuthHeaders());

                if (Object.keys(response).length === 0) {
                    this.setState({
                        eventIds: this.state.eventIds.filter(id => id !== eventId),
                        dialogBusy: false,
                        dialogStatus: "",
                        dialogType: undefined
                    });
                } else {
                    this.setState({
                        dialogBusy: false,
                        dialogStatus: `Failed to delete event: ${response.error?.message}`
                    });
                    console.log(response.error);
                }
            } catch (error) {
                if (error instanceof Error) {
                    this.setState({
                        dialogBusy: false,
                        dialogStatus: `Failed to delete event: ${error.message}`
                    });
                }
            }
        });
    }

    /**
     *  Get the event information as a JSON payload.
     * @param url The url that returns event info as Json
     * @returns Config of the event
     */
    private async fetchEventJsonConfig(url: URL): Promise<IParticipationEventInfo | undefined> {
        try {
            const response = await FetchHelper.json<unknown, IParticipationEventInfo>(
                url.origin,
                url.pathname,
                "get");

                return response;
        } catch {
            try {
                const response = await FetchHelper.text<unknown, IParticipationEventInfo>(
                    url.origin,
                    url.pathname,
                    "get");

                    return response;
            } catch (error) {
                if (error instanceof Error) {
                    this.setState({
                        dialogBusy: false,
                        dialogStatus: `Failed to add event: ${error.message}`
                    });
                }
            }
        }
    }

    /**
     * Validate is input string valid json or url.
     * @param input The input to validate
     * @returns Returns boolean if input is valid
     */
    private validateJsonOrUrl(input: string): boolean {
        try {
            JSON.parse(input);
            return true;
        } catch {
            try {
                const url = new URL(input);
                return Boolean(url);
             } catch {
                 return false;
             }
        }
    }
}

export default Participation;
