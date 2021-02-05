import React from "react";
import ReactDOM from "react-dom";
import { Helmet } from "react-helmet";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App";
import { ServiceFactory } from "./factories/serviceFactory";
import "./index.scss";
import { IBrandConfiguration } from "./models/IBrandConfiguration";
import { AuthService } from "./services/authService";
import { EventAggregator } from "./services/eventAggregator";
import { LocalStorageService } from "./services/localStorageService";
import { MetricsService } from "./services/metricsService";
import { NodeConfigService } from "./services/nodeConfigService";
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
                        <Helmet>
                            <link
                                rel="apple-touch-icon"
                                sizes="180x180"
                                href={`/branding/${brandConfiguration?.name.toLowerCase()
                                    }/favicon/apple-touch-icon.png`}
                            />
                            <link
                                rel="icon"
                                type="image/png"
                                sizes="32x32"
                                href={`/branding/${brandConfiguration?.name.toLowerCase()
                                    }/favicon/favicon-32x32.png`}
                            />
                            <link
                                rel="icon"
                                type="image/png"
                                sizes="16x16"
                                href={`/branding/${brandConfiguration?.name.toLowerCase()
                                    }/favicon/favicon-16x16.png`}
                            />
                            <link
                                rel="manifest"
                                href={`/branding/${brandConfiguration?.name.toLowerCase()
                                    }/favicon/site.webmanifest`}
                            />
                            <link
                                rel="mask-icon"
                                href={`/branding/${brandConfiguration?.name.toLowerCase()
                                    }/favicon/safari-pinned-tab.svg`}
                                color="#485776"
                            />
                            <title>{brandConfiguration?.name} Dashboard</title>
                            <meta name="keywords" content={`IOTA,Node,Dashboard,${brandConfiguration?.name}`} />
                            <meta name="description" content={`IOTA Node Dashboard ${brandConfiguration?.name}`} />
                        </Helmet>
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
    ServiceFactory.register("storage", () => new LocalStorageService());

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

    const visualizerService = new VisualizerService();
    visualizerService.initialize();
    ServiceFactory.register("visualizer", () => visualizerService);

    EventAggregator.subscribe("auth-state", "init", () => {
        webSocketService.resubscribe();
    });

    return BrandHelper.initialize();
}
