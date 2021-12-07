import React, { ReactNode } from "react";
import classNames from "classnames";
import { ReactComponent as ParticipationIcon } from "../../../assets/plugins/spammer.svg";
import { ReactComponent as ChevronRightIcon } from "../../assets/chevron-right.svg";
import InfoPanel from "../../components/layout/InfoPanel";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { IParticipationEvents } from "../../../models/plugins/IParticipationEvents";
import { IParticipationEvent } from "../../../models/plugins/IParticipationEvent";
import { IParticipationEventInfo } from '../../../models/plugins/IParticipationEventInfo';
import { IParticipationEventStatus } from '../../../models/plugins/IParticipationEventStatus';
import { TangleService } from "../../../services/tangleService";
import { AuthService } from "../../../services/authService";
import { FetchHelper } from "../../../utils/fetchHelper";
import AsyncComponent from "../../components/layout/AsyncComponent";
import Dialog from "../../components/layout/Dialog";
import Spinner from "../../components/layout/Spinner";
import "./Participation.scss";
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
            eventInfo:"",
            eventInfoUrl:""
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
            if (info.features.includes("Participation")) {
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
        icon: ReactNode;
        title: string;
        description: string;
        settings: ReactNode;
    } | undefined {
        if (Participation._isAvailable) {
            return {
                icon: <ParticipationIcon />,
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
     */
    public componentDidUpdate(prevProps: unknown, prevState: ParticipationState): void {
        if (this.state.eventIds !== prevState.eventIds) {
            this.state.eventIds.map(id => {
                this.fetchEventInfo(id)
                this.fetchEventStatus(id)
                
            });
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
                    <div className="row spread">
                        <h2>{Participation.PLUGIN_TITLE}</h2>
                        <div className="row">
                            <button
                                type="button"
                                className="add-button"
                                onClick={() => this.setState({
                                    dialogType: "add",
                                    dialogIsAdd: true,
                                    dialogStatus: "",
                                    dialogBusy: false
                                })}
                            >
                                Add Event
                            </button>
                        </div>
                    </div>
                    <div className="events-panel">
                        {this.state.eventIds.length === 0 && (
                            <p className="margin-t-s">There are no events.</p>
                        )}
                        {this.state.eventIds.map((e, idx) => {
                            const eventInfo = this.state.events[e];
                            return (<div className="events-panel--item" key={idx}>
                                <div className="card col padding-m">
                                    <div className="col">
                                        <div className="event-id word-break-all margin-b-s">
                                            <span><h4>ID</h4> {e}</span>
                                        </div>
                                        <div className="participation-item">
                                            <h4>Name</h4>
                                            <div className="participation-value word-break-all">
                                                {eventInfo?.name}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row wrap">
                                        <div className="participation-item">
                                            <h4>Milestone index commence</h4>
                                            <div className="participation-value word-break-all">
                                                {eventInfo?.milestoneIndexCommence}
                                            </div>
                                        </div>
                                        <div className="participation-item">
                                            <h4>Milestone index start</h4>
                                            <div className="participation-value word-break-all">
                                                {eventInfo?.milestoneIndexStart}
                                            </div>
                                        </div>
                                        <div className="participation-item">
                                            <h4>Milestone index end</h4>
                                            <div className="participation-value word-break-all">
                                                {eventInfo?.milestoneIndexEnd}
                                            </div>
                                        </div>
                                        <div className="participation-item">
                                            <h4>Type</h4>
                                            <div className="participation-value word-break-all">
                                                {eventInfo?.payload.type == 0 ? 'Ballot' : 'Staking'}
                                            </div>
                                        </div>
                                        <div className="participation-item">
                                            <h4>Status</h4>
                                            <div className="participation-value word-break-all">
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
                                                dialogIsAdd: false,
                                                dialogStatus: "",
                                                dialogBusy: false,
                                                detailsId: e,
                                            })}
                                        >
                                            More details
                                        </button>
                                        <button
                                            type="button"
                                            className="card--action card--action-danger margin-t-s"
                                            onClick={() => this.setState({
                                                dialogType: "delete",
                                                dialogIsAdd: false,
                                                dialogStatus: "",
                                                dialogBusy: false,
                                                deleteId: e,
                                            })}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )})}
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
                                    className={(this.state.dialogType == "details") ? "d-none" : ''}
                                    type="button"
                                    onClick={() =>
                                        (this.state.dialogIsAdd ? this.eventAdd() : this.eventDelete(this.state.deleteId))}
                                    key={0}
                                    disabled={this.state.dialogBusy || (
                                        this.state.dialogIsAdd &&
                                        (!this.state.eventInfo ||
                                        this.state.eventInfo.trim().length === 0||
                                        !this.isValidJson(this.state.eventInfo))
                                    )}
                                >
                                    {this.state.dialogIsAdd ? "OK" : "Yes"}
                                </button>,
                                <button
                                    type="button"
                                    onClick={() => this.setState({
                                        dialogType: undefined,
                                        deleteId: undefined
                                    })}
                                    key={1}
                                    disabled={this.state.dialogBusy}
                                >
                                    {this.state.dialogIsAdd || this.state.dialogType === "details" ? "Cancel" : "No"}
                                </button>
                            ]}
                        >
                            {this.state.dialogType === "delete" && (
                                <p className="margin-b-l">Are you sure you want to delete the event {(this.state.deleteId) ? this.state.events[this.state.deleteId].name : ''}?</p>
                            )}
                            {(this.state.dialogType === "details" && this.state.detailsId)  && (
                                <div className="row wrap">
                                    <div className="participation-item">
                                        <h4>Milestone index</h4>
                                        <div className="participation-value word-break-all">
                                            {this.state.events[this.state.detailsId].status.milestoneIndex}
                                        </div>
                                    </div>
                                    <div className="participation-item">
                                        <h4>Status</h4>
                                        <div className="participation-value word-break-all">
                                            {this.state.events[this.state.detailsId].status.status
                                                .slice(0, 1).toUpperCase()}{this.state.events[this.state.detailsId].status.status.slice(1)}
                                        </div>
                                    </div>
                                    {/* Ballot */}
                                    {this.state.events[this.state.detailsId].payload.type == 0 && (
                                        <div>
                                            {this.state.events[this.state.detailsId].payload.questions.map((q: any, idx: any) => {
                                            return (<div className="participation-item--background margin-b-s" key={idx}>
                                                        <div className="participation-item participation-item--small">
                                                            <h4>Question</h4>
                                                            <div className="participation-value word-break-all">
                                                                {q.text}
                                                            </div>
                                                        </div>

                                                        {q.answers.map((a: any, idy: any) => {
                                                            return (<div className="row wrap" key={idy}>
                                                                        <div className="participation-item participation-item--small">
                                                                            <h4>Answer</h4>
                                                                            <div className="participation-value word-break-all">
                                                                                {a.text}
                                                                            </div>
                                                                        </div>
                                                                        <div className="participation-item participation-item--small">
                                                                            <h4>current</h4>
                                                                            <div className="participation-value word-break-all">
                                                                                {(this.state.detailsId) ? this.state.events[this.state.detailsId].status.questions[idx].answers[idy].current : ''}
                                                                            </div>
                                                                        </div>
                                                                        <div className="participation-item participation-item--small">
                                                                            <h4>accumulated</h4>
                                                                            <div className="participation-value word-break-all">
                                                                                {(this.state.detailsId) ? this.state.events[this.state.detailsId].status.questions[idx].answers[idy].accumulated : ''}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                            )})}
                                                    </div>
                                            )})}
                                        </div>
                                        
                                    )}

                                    {/* Staking */}
                                    
                                </div>
                            )}
                            {this.state.dialogIsAdd && (
                                <React.Fragment>
                                    <p>Please enter the details of the event to {this.state.dialogType}.</p>
                                    
                                    <div className="dialog--label">
                                        Json Config or URL
                                    </div>
                                    <div className="dialog--value">
                                        <textarea
                                            className="textarea--stretch dialog--value-textarea dialog--value-textarea__json"
                                            placeholder='e.g. {"name":"Example even title" ... } or http://example.com'
                                            value={this.state.eventInfo}
                                            disabled={this.state.dialogBusy}
                                            onChange={e => this.setState({ eventInfo: e.target.value })}
                                        />
                                        {this.state.eventInfo && !this.isValidJson(this.state.eventInfo) && (
                                            <span className="validation--error">Not a valid JSON</span>
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
            const response = await FetchHelper.json<unknown, {
                data?: IParticipationEvents;
                error?: {
                    message: string;
                };
            }>(
                `${window.location.protocol}//${window.location.host}`,
                "/api/plugins/participation/events",
                "get",
                undefined,
                Participation.buildAuthHeaders());

            if (response.data) {
                this.setState({
                    eventIds: response.data.eventIds
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
     */
    private async fetchEventInfo(id: string): Promise<void> {
        try {
            const response = await FetchHelper.json<unknown, {
                data?: IParticipationEventInfo;
                error?: {
                    message: string;
                };
            }>(
                `${window.location.protocol}//${window.location.host}`,
                `/api/plugins/participation/events/${id}`,
                "get",
                undefined,
                Participation.buildAuthHeaders());

            if (response.data) {
                this.setState(prevState => ({
                    events: {
                        ...prevState.events,
                        [id]: response.data
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
     */
    private async fetchEventStatus(id: string): Promise<void> {
        try {
            const response = await FetchHelper.json<unknown, {
                data?: IParticipationEventStatus;
                error?: {
                    message: string;
                };
            }>(
                `${window.location.protocol}//${window.location.host}`,
                `/api/plugins/participation/events/${id}/status`,
                "get",
                undefined,
                Participation.buildAuthHeaders());

            if (response.data) {
                if(this.state.events[id]){
                    this.setState(prevState => ({
                        ...prevState,
                        events:{
                            ...prevState.events,
                            [id]: {
                                ...prevState.events[id],
                                status: response.data
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
     *  Add new Event.
     */
    private async eventAdd(): Promise<void> {
        this.setState({
            dialogBusy: true,
            dialogStatus: "Adding event, please wait..."
        }, async () => {
  
            try {
                const response = await FetchHelper.json<unknown, {
                    data?: IParticipationEvent;
                    error?: {
                        message: string;
                    };
                }>(
                    `${window.location.protocol}//${window.location.host}`,
                    "/api/plugins/participation/admin/events",
                    "post",
                    JSON.parse(this.state.eventInfo),
                    Participation.buildAuthHeaders());
                    
                    this.setState({
                        dialogBusy: false,
                        dialogStatus: "",
                        dialogType: undefined
                    });

                if (response.data) {
                    const id = response.data.eventId
                    this.setState(prevState => ({
                        eventIds:[ 
                            id,
                            ...prevState.eventIds]
                    }))
                    
                } else {
                    this.setState({
                        dialogBusy: false,
                        dialogStatus: `Failed to add event: ${response.error}`
                    });
                    console.log(response.error);
                }
            } catch (err) {
                this.setState({
                    dialogBusy: false,
                    dialogStatus: `Failed to add event: ${err.message}`
                });
            }
        });
    }

    /**
     *  Delete event.
     */
    private async eventDelete(eventId: string | undefined): Promise<void> {
        this.setState({
            dialogBusy: true,
            dialogStatus: "Deleting event, please wait..."
        }, async () => {
            try {
                const response = await FetchHelper.json<unknown, {
                    data?: any;
                    error?: {
                        message: string;
                    };
                }>(
                    `${window.location.protocol}//${window.location.host}`,
                    `/api/plugins/participation/admin/events/${eventId}`,
                    "delete",
                    undefined,
                    Participation.buildAuthHeaders());
                    this.setState({
                        dialogBusy: false,
                        dialogStatus: "",
                        dialogType: undefined
                    });
                if (Object.keys(response).length === 0) {
                    this.setState({
                        eventIds: this.state.eventIds.filter(id => id !== eventId)
                    });
                } else {
                    console.log(response.error);
                }
            } catch (err) {
                this.setState({
                    dialogBusy: false,
                    dialogStatus: `Failed to delete event: ${err.message}`
                });
            }
        });
    }

    /**
     *  Get the event information as a JSON payload.
     */
    private async fetchEventJsonConfig(url: string): Promise<void> {
        try {
            const response = await FetchHelper.json<unknown, {
                data?: any;
                error?: {
                    message: string;
                };
            }>(
                url,
                "",
                "get",
                undefined,
                undefined);

                this.setState({
                    eventInfo: JSON.stringify(response, undefined, 4)
                });

        } catch (err) {
            console.log(err);
        }
    }

    /**
     * Validate is the Event info valid Json.
     */
    private isValidJson(json: string): boolean {
        try {
            JSON.parse(json);
        } catch (e) {
            return false;
        }
        return true; 
    }

    /**
     * Validate is input string valid url.
     */
    private isValidUrl(input: string): boolean {
        try {
           new URL(input);
        } catch (e) {
            return false;  
        }
        return true;
    }
}

export default Participation;