import React, { ReactNode } from "react";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { ISpammerSettings } from "../../../models/plugins/ISpammerSettings";
import { AuthService } from "../../../services/authService";
import { TangleService } from "../../../services/tangleService";
import { FetchHelper } from "../../../utils/fetchHelper";
import AsyncComponent from "../../components/layout/AsyncComponent";
import ToggleButton from "../layout/ToggleButton";
import "./Spammer.scss";
import { SpammerState } from "./SpammerState";

/**
 * Spammer panel.
 */
class Spammer extends AsyncComponent<unknown, SpammerState> {
    /**
     * The title of the plugin.
     */
    private static readonly PLUGIN_TITLE = "Spammer";

    /**
     * The description of the plugin.
     */
    private static readonly PLUGIN_DESCRIPTION = "Spam the IOTA network with data blocks.";

    /**
     * Is the spammer plugin available.
     */
    private static _isAvailable: boolean = false;

    /**
     * Create a new instance of Spammer.
     * @param props The props.
     */
    constructor(props: unknown) {
        super(props);

        this.state = {
            isRunning: false,
            bps: "1",
            cpu: "80",
            workers: "0",
            workersMax: 0
        };
    }

    /**
     * Is the plugin available.
     */
    public static async initPlugin(): Promise<void> {
        Spammer._isAvailable = false;
        const tangleService = ServiceFactory.get<TangleService>("tangle");

        try {
            const info = await tangleService.info();
            if (info.plugins.includes("spammer/v1")) {
                Spammer._isAvailable = true;
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
        if (Spammer._isAvailable) {
            return {
                title: Spammer.PLUGIN_TITLE,
                description: Spammer.PLUGIN_DESCRIPTION,
                settings: <Spammer />
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

        await this.pluginStatus();
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="card padding-l">
                <div className="spammer">
                    <h2>{Spammer.PLUGIN_TITLE}</h2>
                    <p className="margin-t-s">
                        {Spammer.PLUGIN_DESCRIPTION}
                    </p>
                    <div className="card--label">
                        Running
                    </div>
                    <div className="card--value row">
                        <ToggleButton
                            value={this.state.isRunning}
                            onChanged={async value => {
                                await (value ? this.pluginStart() : this.pluginStop());
                            }}
                        />
                    </div>
                    <h2 className="margin-t-s">Settings</h2>
                    <div className="card--label">
                        Blocks Per Second
                    </div>
                    <div className="card--value row">
                        <input
                            type="text"
                            value={this.state.bps}
                            disabled={!this.state.isRunning}
                            onChange={e => this.setState({ bps: e.target.value })}
                            onBlur={e => this.validateSettings()}
                        />
                    </div>
                    <div className="card--label">
                        CPU Utilization
                    </div>
                    <div className="card--value row middle">
                        <input
                            type="text"
                            value={this.state.cpu}
                            disabled={!this.state.isRunning}
                            onChange={e => this.setState({ cpu: e.target.value })}
                            onBlur={e => this.validateSettings()}
                        />
                        <p className="margin-l-t">%</p>
                    </div>
                    <div className="card--label">
                        Number of Workers
                    </div>
                    <div className="card--value row">
                        <input
                            type="text"
                            value={this.state.workers}
                            disabled={!this.state.isRunning}
                            onChange={e => this.setState({ workers: e.target.value })}
                            onBlur={e => this.validateSettings()}
                        />
                    </div>
                    <hr />
                    <div className="card--value">
                        <button
                            className="card--action margin-r-s"
                            type="button"
                            disabled={!this.state.isRunning}
                            onClick={async e => this.pluginStart()}
                        >
                            Apply
                        </button>
                    </div>
                </div>
            </div>

        );
    }

    /**
     * Get the status for the plugin.
     */
    private async pluginStatus(): Promise<void> {
        try {
            const response = await FetchHelper.json<unknown, ISpammerSettings>(
                    `${window.location.protocol}//${window.location.host}`,
                    "/api/plugins/spammer/v1/status",
                    "get",
                    undefined,
                    Spammer.buildAuthHeaders()
                );

            if (!response?.error) {
                this.setState({
                    isRunning: response.running,
                    bps: response.bpsRateLimit.toString(),
                    cpu: (response.cpuMaxUsage * 100).toString(),
                    workers: response.spammerWorkers.toString(),
                    workersMax: response.spammerWorkersMax
                });
            } else {
                console.log("loging eror", response.error);
            }
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * Validate the settings for the plugin.
     */
    private validateSettings(): void {
        const bps = Number.parseFloat(this.state.bps);
        if (Number.isNaN(bps)) {
            this.setState({ bps: "1" });
        }

        const cpu = Number.parseFloat(this.state.cpu);
        if (Number.isNaN(cpu)) {
            this.setState({ cpu: "80" });
        } else if (cpu < 0 || cpu > 100) {
            this.setState({ cpu: "80" });
        }

        const numWorkers = Number.parseInt(this.state.workers, 10);
        if (Number.isNaN(numWorkers)) {
            this.setState({ workers: this.state.workersMax.toString() });
        } else if (numWorkers <= 0 || numWorkers > this.state.workersMax) {
            this.setState({ workers: this.state.workersMax.toString() });
        }
    }

    /**
     * Start the plugin.
     */
    private async pluginStart(): Promise<void> {
        try {
            await FetchHelper.json<unknown, ISpammerSettings>(
                `${window.location.protocol}//${window.location.host}`,
                "/api/plugins/spammer/v1/start",
                "post",
                {
                    bpsRateLimit: Number.parseFloat(this.state.bps),
                    cpuMaxUsage: Number.parseFloat(this.state.cpu) / 100,
                    spammerWorkers: Number.parseInt(this.state.workers, 10)
                },
                Spammer.buildAuthHeaders());

            await this.pluginStatus();
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * Stop the plugin.
     */
    private async pluginStop(): Promise<void> {
        try {
            await FetchHelper.json<unknown, ISpammerSettings>(
                `${window.location.protocol}//${window.location.host}`,
                "/api/plugins/spammer/v1/stop",
                "post",
                undefined,
                Spammer.buildAuthHeaders());

            await this.pluginStatus();
        } catch (err) {
            console.log(err);
        }
    }
}

export default Spammer;
