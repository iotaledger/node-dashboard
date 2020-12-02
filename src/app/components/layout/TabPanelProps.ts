import { ReactNode } from "react";

export interface TabPanelProps {
    /**
     * The buttons to display on the panel.
     */
    labels: string[];

    /**
     * The child controls.
     */
    children?: ReactNode[];
}
