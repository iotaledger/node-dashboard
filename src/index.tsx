import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App";
import Participation from "./app/components/plugins/Participation";
import Spammer from "./app/components/plugins/Spammer";
import { ServiceFactory } from "./factories/serviceFactory";
import "./index.scss";
import { IBrandConfiguration } from "./models/IBrandConfiguration";
import { AuthService } from "./services/authService";
import { EventAggregator } from "./services/eventAggregator";
import { LocalStorageService } from "./services/localStorageService";
import { MetricsService } from "./services/metricsService";
import { NodeConfigService } from "./services/nodeConfigService";
import { SessionStorageService } from "./services/sessionStorageService";
import { SettingsService } from "./services/settingsService";
import { TangleService } from "./services/tangleService";
import { ThemeService } from "./services/themeService";
import { VisualizerService } from "./services/visualizerService";
import { WebSocketService } from "./services/webSocketService";
import { BrandHelper } from "./utils/brandHelper";

initServices()
    .then(brandConfiguration => {
        ReactDOM.render(
            !brandConfiguration
                ? (<div>REACT_APP_BRAND_ID is not set</div>)
                : (
                    <BrowserRouter>
                        <App />
                    </BrowserRouter>
                ),
            document.querySelector("#root")
        );
    })
    .catch(err => console.error(err));

/**
 * Initialise the services.
 * @returns The brand configuration.
 */
async function initServices(): Promise<IBrandConfiguration | undefined> {
    ServiceFactory.register("local-storage", () => new LocalStorageService());
    ServiceFactory.register("session-storage", () => new SessionStorageService());
    const settingsService = new SettingsService();
    ServiceFactory.register("settings", () => settingsService);

    const authService = new AuthService();
    await authService.initialize();
    ServiceFactory.register("auth", () => authService);

    const webSocketService = new WebSocketService();
    ServiceFactory.register("web-socket", () => webSocketService);
    ServiceFactory.register("tangle", () => new TangleService());

    const themeService = new ThemeService();
    themeService.initialize();
    ServiceFactory.register("theme", () => themeService);

    const nodeConfigService = new NodeConfigService();
    await nodeConfigService.initialize();
    ServiceFactory.register("node-config", () => nodeConfigService);

    const metricsService = new MetricsService();
    ServiceFactory.register("metrics", () => metricsService);
    metricsService.initialize();

    ServiceFactory.register("visualizer", () => new VisualizerService());

    EventAggregator.subscribe("auth-state", "init", async () => {
        webSocketService.resubscribe();
        await Spammer.initPlugin();
        await Participation.initPlugin();
    });

    EventAggregator.subscribe("online", "init", async o => {
        if (o) {
            await nodeConfigService.initialize();
            webSocketService.resubscribe();
        }
    });

    await Spammer.initPlugin();
    await Participation.initPlugin();

    settingsService.initialize();

    return BrandHelper.initialize();
}
