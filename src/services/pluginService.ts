import { IClient, SingleNodeClient } from "@iota/iota.js";
import { ServiceFactory } from "../factories/serviceFactory";
import { IProofOfInclusion } from "../models/plugins/IProofOfInclusion";
import { ISpammerSettings } from "../models/plugins/ISpammerSettings";
import { IValidatePoiResponse } from "../models/plugins/IValidatePoiResponse";
import { IParticipationEvent } from "../models/plugins/participation/IParticipationEvent";
import { IParticipationEventInfo } from "../models/plugins/participation/IParticipationEventInfo";
import { IParticipationEvents } from "../models/plugins/participation/IParticipationEvents";
import { IParticipationEventStatus } from "../models/plugins/participation/IParticipationEventStatus";
import { AuthService } from "./authService";
/**
 * Service to handle plugins api requests.
 */
export class PluginService {
    /**
     * The auth service.
     */
    private readonly _authService: AuthService;

    /**
     * Create a new instance of PluginService.
     */
    constructor() {
        this._authService = ServiceFactory.get<AuthService>("auth");
    }

    /** Spammer Plugin */
    /**
     * Get the status of the Spammer plugin.
     * @returns The Spammer settings.
     */
    public async spammerStatus(): Promise<ISpammerSettings | undefined> {
        const client = this.buildClient();

        try {
            return await client.pluginFetch<unknown, ISpammerSettings>(
                "spammer/v1/",
                "get",
                "status"
            );
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * Start the Spammer plugin.
     * @param settings The spammer settings.
     */
    public async spammerStart(settings: ISpammerSettings): Promise<void> {
        const client = this.buildClient();

        try {
            await client.pluginFetch<unknown, ISpammerSettings>(
                "spammer/v1/",
                "post",
                "start",
                undefined,
                settings
            );
        } catch {}
    }

    /**
     * Stop the Spammer plugin.
     */
    public async spammerStop(): Promise<void> {
        const client = this.buildClient();

        try {
            await client.pluginFetch<unknown, ISpammerSettings>(
                "spammer/v1/",
                "post",
                "stop"
            );
        } catch {}
    }

    /** Participation Plugin */
    /**
     * Get Participation events.
     * @returns The participation events.
     */
    public async fetchParticipationEvents(): Promise<IParticipationEvents | undefined> {
        const client = this.buildClient();

        try {
            return await client.pluginFetch<unknown, IParticipationEvents>(
                "participation/v1/",
                "get",
                "events"
            );
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * Get the event information as a JSON payload.
     * @param id Event id.
     * @returns The participation event info.
     */
    public async fetchParticipationEventInfo(id: string): Promise<IParticipationEventInfo | undefined> {
        const client = this.buildClient();

        try {
            return await client.pluginFetch<unknown, IParticipationEventInfo>(
                "participation/v1/",
                "get",
                `events/${id}`
            );
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * Get the event status info as a JSON payload.
     * @param id Event id.
     * @returns The participation event status.
     */
    public async fetchParticipationEventStatus(id: string): Promise<IParticipationEventStatus | undefined> {
        const client = this.buildClient();

        try {
            return await client.pluginFetch<unknown, IParticipationEventStatus>(
                "participation/v1/",
                "get",
                `events/${id}/status`
            );
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * Add new participation event.
     * @param eventInfo JSON string that contains the event info that is to be added.
     * @returns The participation event.
     */
    public async addParticipationEvent(eventInfo: IParticipationEventInfo): Promise<IParticipationEvent | undefined> {
        const client = this.buildClient();

        try {
            return await client.pluginFetch<unknown, IParticipationEvent>(
                "participation/v1/",
                "post",
                "admin/events",
                undefined,
                eventInfo
            );
        } catch (err) {
            console.log(err);
        }
    }

    /**
     *  Delete participation event.
     * @param id The Id of the event to delete.
     * @returns The empty object if deletion was successful.
     */
    public async deleteParticipationEvent(id: string): Promise<unknown | undefined> {
        const client = this.buildClient();

        try {
            return await client.pluginFetch<unknown, undefined>(
                "participation/v1/",
                "delete",
                `admin/events/${id}`
            );
        } catch (err) {
            console.log(err);
        }
    }

    /** Proof of inclusion plugin */
    /**
     * Get the poi for the block.
     * @param blockId The id of the block.
     * @returns The poi for the block.
     */
    public async fetchPoi(blockId: string): Promise<IProofOfInclusion | undefined> {
        const client = this.buildClient();

        try {
            return await client.pluginFetch<unknown, IProofOfInclusion>(
                "poi/v1/",
                "get",
                `create/${blockId}`
            );
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * Validate the poi for the block.
     * @param poi The poi of the block.
     * @returns Is poi valid.
     */
    public async validatePoi(poi: IProofOfInclusion): Promise<boolean> {
        const client = this.buildClient();

        try {
            const response = await client.pluginFetch<IProofOfInclusion, IValidatePoiResponse>(
                "poi/v1/",
                "post",
                "validate",
                undefined,
                poi
            );

            return response.valid;
        } catch (err) {
            console.log(err);
            return false;
        }
    }

    /**
     * Build a client with auth header.
     * @returns The client.
     */
    private buildClient(): IClient {
        const headers = this._authService.buildAuthHeaders();

        return new SingleNodeClient(
            `${window.location.protocol}//${window.location.host}`,
            {
                basePath: "/dashboard/api/",
                headers
            }
        );
    }
}
