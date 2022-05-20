import classNames from "classnames";
import React, { Component, ReactNode } from "react";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { EventAggregator } from "../../../services/eventAggregator";
import { ThemeService } from "../../../services/themeService";
import { BrandHelper } from "../../../utils/brandHelper";
import "./NavPanel.scss";
import { NavPanelProps } from "./NavPanelProps";
import { NavPanelState } from "./NavPanelState";

/**
 * Navigation panel.
 */
class NavPanel extends Component<RouteComponentProps & NavPanelProps, NavPanelState> {
    /**
     * The theme service.
     */
    private readonly _themeService: ThemeService;

    /**
     * Create a new instance of NavPanel;
     * @param props The props.
     */
    constructor(props: RouteComponentProps & NavPanelProps) {
        super(props);

        this._themeService = ServiceFactory.get<ThemeService>("theme");

        this.state = {
            logoSrc: ""
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        this.setState({
            logoSrc: await BrandHelper.getLogoNavigation(this._themeService.get())
        });

        EventAggregator.subscribe("theme", "navpanel", async (theme: string) => {
            this.setState({
                logoSrc: await BrandHelper.getLogoNavigation(theme)
            });
        });
    }

    /**
     * The component will unmount.
     */
    public componentWillUnmount(): void {
        EventAggregator.unsubscribe("theme", "navpanel");
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className={classNames("nav-panel", { "full-width": this.props.fullWidth })}>
                <Link
                    to="/"
                >
                    <img src={this.state.logoSrc} className="logo" />
                </Link>

                <div className="nav-panel-middle">
                    {this.props.middle.map(b => (
                        <React.Fragment key={b.label}>
                            {!b.hidden && b.route && (
                                <Link
                                    to={b.route}
                                    className={classNames(
                                        "nav-panel--button",
                                        {
                                            "nav-panel--button__selected":
                                                (b.route.length > 1 &&
                                                    this.props.location.pathname.startsWith(b.route)) ||
                                                b.route === this.props.location.pathname
                                        }
                                    )}
                                >
                                    {b.icon}
                                    <span className="nav-panel-button-label">{b.label}</span>
                                </Link>
                            )}
                            {!b.hidden && b.function && (
                                <button
                                    type="button"
                                    onClick={() => b.function?.()}
                                    className={classNames(
                                        "nav-panel--button"
                                    )}
                                >
                                    {b.icon}
                                    <span className="nav-panel-button-label">{b.label}</span>
                                </button>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <div className="nav-panel-end">
                    {this.props.end.map(b => (
                        <React.Fragment key={b.label}>
                            {!b.hidden && b.route && (
                                <Link
                                    to={b.route}
                                    className={classNames(
                                        "nav-panel--button",
                                        {
                                            "nav-panel--button__selected":
                                                (b.route.length > 1 &&
                                                    this.props.location.pathname.startsWith(b.route)) ||
                                                b.route === this.props.location.pathname
                                        }
                                    )}
                                >
                                    {b.icon}
                                    <span className="nav-panel-button-label">{b.label}</span>
                                </Link>
                            )}
                            {!b.hidden && b.function && (
                                <button
                                    type="button"
                                    onClick={() => b.function?.()}
                                    className={classNames(
                                        "nav-panel--button"
                                    )}
                                >
                                    {b.icon}
                                    <span className="nav-panel-button-label">{b.label}</span>
                                </button>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        );
    }
}

export default withRouter(NavPanel);
