import { ReactNode } from "react";

export interface TabPanelProps {
    /**
     * The labels to display on the panel.
     */
    tabs: string[];

    /**
     * The active tab.
     */
    activeTab: string;

    /**
     * The child controls.
     */
    children?: ReactNode[];

    /**
     * The tab changed.
     */
    onTabChanged?(activeTab: string): void;
}
