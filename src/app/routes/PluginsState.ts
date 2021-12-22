import { ReactNode } from "react";

export interface PluginsState {

    /**
     * The active tab.
     */
    activeTab?: string;

    /**
     * Plugins.
     */
    plugins: {
        title: string;
        description: string;
        settings: ReactNode;
    }[];
}
