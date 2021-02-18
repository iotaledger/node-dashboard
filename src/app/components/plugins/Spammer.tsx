import React, { ReactNode } from "react";
import { ReactComponent as SpammerIcon } from "../../../assets/plugins/spammer.svg";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { ISpammerSettings } from "../../../models/plugins/ISpammerSettings";
import { AuthService } from "../../../services/authService";
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
    private static readonly PLUGIN_DESCRIPTION = "Spams the IOTA network with transactions" +
        " doing proof of work locally. Must inject a curl implementation to perform proof of work and other things.";

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
            mps: "1",
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

        try {
            const authHeaders = Spammer.buildAuthHeaders();

            if (authHeaders.Authorization) {
                const res = await FetchHelper.json<unknown, {
                    data?: ISpammerSettings;
                    error?: {
                        message: string;
                    };
                }>(
                    `${window.location.protocol}//${window.location.host}`,
                    "/api/plugins/spammer/?cmd=settings",
                    "get",
                    undefined,
                    authHeaders);


                if (res.data) {
                    Spammer._isAvailable = true;
                }
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
        if (Spammer._isAvailable) {
            return {
                icon: <SpammerIcon />,
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
        const loginData = authService.isLoggedIn();
        if (loginData) {
            headers.Authorization = `Bearer ${loginData.jwt}`;
            if (loginData.csrf) {
                headers["X-XSRF-TOKEN"] = loginData.csrf;
            }
        }

        return headers;
    }

    /**
     * The component did mount.
     */
    public async componentDidMount(): Promise<void> {
        super.componentDidMount();

        await this.pluginSettings();
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
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
                    Messages Per Second
                </div>
                <div className="card--value row">
                    <input
                        type="text"
                        value={this.state.mps}
                        onChange={e => this.setState({ mps: e.target.value })}
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
                        onChange={e => this.setState({ workers: e.target.value })}
                        onBlur={e => this.validateSettings()}
                    />
                </div>
                <hr />
                <div className="card--value">
                    <button
                        className="card--action margin-r-s"
                        type="button"
                        onClick={async e => this.pluginStart()}
                    >
                        Apply
                    </button>
                </div>
            </div>
        );
    }

    /**
     * Get the settings for the plugin.
     */
    private async pluginSettings(): Promise<void> {
        try {
            const response = await FetchHelper.json<unknown, {
                data?: ISpammerSettings;
                error?: {
                    message: string;
                };
            }>(
                `${window.location.protocol}//${window.location.host}`,
                "/api/plugins/spammer/?cmd=settings",
                "get",
                undefined,
                Spammer.buildAuthHeaders());

            if (response.data) {
                this.setState({
                    isRunning: response.data.running,
                    mps: response.data.mpsRateLimit.toString(),
                    cpu: (response.data.cpuMaxUsage * 100).toString(),
                    workers: response.data.spammerWorkers.toString(),
                    workersMax: response.data.spammerWorkersMax
                });
            } else {
                console.log(response.error);
            }
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * Validate the settings for the plugin.
     */
    private validateSettings(): void {
        const mps = Number.parseFloat(this.state.mps);
        if (Number.isNaN(mps)) {
            this.setState({ mps: "1" });
        }

        const cpu = Number.parseFloat(this.state.cpu);
        if (Number.isNaN(cpu)) {
            this.setState({ cpu: "80" });
        } else if (cpu < 0 || cpu > 100) {
            this.setState({ cpu: "80" });
        }

        const numWorkers = Number.parseFloat(this.state.workers);
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
            const response = await FetchHelper.json<unknown, {
                data?: ISpammerSettings;
                error?: {
                    message: string;
                };
            }>(
                `${window.location.protocol}//${window.location.host}`,
                `/api/plugins/spammer/?cmd=start&mpsRateLimit=${this.state.mps
                }&cpuMaxUsage=${Number.parseFloat(this.state.cpu) / 100
                }&spammerWorkers=${this.state.workers}`,
                "get",
                undefined,
                Spammer.buildAuthHeaders());

            if (response.data) {
                this.setState({
                    isRunning: response.data.running,
                    mps: response.data.mpsRateLimit.toString(),
                    cpu: (response.data.cpuMaxUsage * 100).toString(),
                    workers: response.data.spammerWorkers.toString()
                });
            } else {
                console.log(response.error);
            }
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * Stop the plugin.
     */
    private async pluginStop(): Promise<void> {
        try {
            const response = await FetchHelper.json<unknown, {
                data?: ISpammerSettings;
                error?: {
                    message: string;
                };
            }>(
                `${window.location.protocol}//${window.location.host}`,
                "/api/plugins/spammer/?cmd=stop",
                "get",
                undefined,
                Spammer.buildAuthHeaders());

            if (response.data) {
                this.setState({
                    isRunning: response.data.running,
                    mps: response.data.mpsRateLimit.toString(),
                    cpu: (response.data.cpuMaxUsage * 100).toString(),
                    workers: response.data.spammerWorkers.toString()
                });
            } else {
                console.log(response.error);
            }
        } catch (err) {
            console.log(err);
        }
    }
}

export default Spammer;
