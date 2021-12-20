import { ReactNode } from "react";

export interface SettingsState {
    /**
     * The current theme.
     */
    theme: string;

    /**
     * Sections.
     */
    sections: string[];

    /**
     * The active section.
     */
    activeSection: string;

    /**
     * Plugins.
     */
    plugins: {
        icon: ReactNode;
        title: string;
        description: string;
        settings: ReactNode;
    }[];
}
