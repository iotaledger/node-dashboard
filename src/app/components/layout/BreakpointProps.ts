import { ReactNode } from "react";

/**
 * The props for the Breakpoint component.
 */
export interface BreakpointProps {
    /**
     * The size to show/hide the component.
     */
    size: "phone" | "tablet" | "desktop";

    /**
     * Show or hide the component if window above or below size.
     */
    aboveBelow: "above" | "below";

    /**
     * The child controls.
     */
    children?: ReactNode[] | ReactNode;
}
