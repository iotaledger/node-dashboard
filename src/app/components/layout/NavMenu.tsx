import React, { Component, ReactNode } from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { EventAggregator } from "../../../services/eventAggregator";
import { ThemeService } from "../../../services/themeService";
import { BrandHelper } from "../../../utils/brandHelper";
import "./NavMenu.scss";
import { NavMenuProps } from "./NavMenuProps";
import { NavMenuState } from "./NavMenuState";

/**
 * Navigation menu.
 */
class NavMenu extends Component<RouteComponentProps & NavMenuProps, NavMenuState> {
    /**
     * The theme service.
     */
    private readonly _themeService: ThemeService;

    /**
     * Create a new instance of NavMenu;
     * @param props The props.
     */
    constructor(props: RouteComponentProps & NavMenuProps) {
        super(props);

        this._themeService = ServiceFactory.get<ThemeService>("theme");

        this.state = {
            logoSrc: "",
            isOpen: false
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        this.setState({
            logoSrc: await BrandHelper.getLogoNavigation(this._themeService.get())
        });

        EventAggregator.subscribe("theme", "navmenu", async (theme: string) => {
            this.setState({
                logoSrc: await BrandHelper.getLogoNavigation(theme)
            });
        });
    }

    /**
     * The component will unmount.
     */
    public componentWillUnmount(): void {
        EventAggregator.unsubscribe("theme", "navmenu");
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div
                className="nav-menu"
                onClick={() => this.state.isOpen && this.setState({ isOpen: false })}
            >
                <button
                    type="button"
                    onClick={() => this.setState({ isOpen: !this.state.isOpen })}
                >
                    <img src={this.state.logoSrc} className="logo" />
                </button>
                {this.state.isOpen && (
                    <div className="popup-container">
                        {this.props.children}
                    </div>
                )}
            </div>
        );
    }
}

export default withRouter(NavMenu);
