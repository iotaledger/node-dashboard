import { Component, ReactNode } from "react";
import { BreakpointProps } from "./BreakpointProps";
import { BreakpointState } from "./BreakpointState";

/**
 * Component to show/hide children based on media size breakpoints.
 */
class Breakpoint extends Component<BreakpointProps, BreakpointState> {
    /**
     * The size for the breakpoints.
     */
    private static readonly SIZE_BREAKPOINTS = {
        "phone": 480,
        "tablet": 768,
        "desktop": 1024
    };

    /**
     * The resize method
     */
    private readonly _resize: () => void;

    /**
     * Create a new instance of Breakpoint.
     * @param props The props.
     */
    constructor(props: BreakpointProps) {
        super(props);

        this._resize = () => this.resize();

        this.state = {
            isVisible: this.calculateVisible()
        };
    }

    /**
     * The component mounted.
     */
    public componentDidMount(): void {
        window.addEventListener("resize", this._resize);
    }

    /**
     * The component will unmount so update flag.
     */
    public componentWillUnmount(): void {
        window.removeEventListener("resize", this._resize);
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return this.state.isVisible
            ? this.props.children
            : null;
    }

    /**
     * Handle the window resize.
     */
    private resize(): void {
        const isVisible = this.calculateVisible();

        this.setState({
            isVisible
        });
    }

    /**
     * Calculate if the child components should be visible.
     * @returns True if the children should be visible.
     */
    private calculateVisible(): boolean {
        const windowSize = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

        return this.props.aboveBelow === "above"
            ? windowSize >= Breakpoint.SIZE_BREAKPOINTS[this.props.size]
            : windowSize < Breakpoint.SIZE_BREAKPOINTS[this.props.size];
    }
}

export default Breakpoint;
