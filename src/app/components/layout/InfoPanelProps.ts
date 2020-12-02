import { ReactNode } from "react";

export interface InfoPanelProps {
    /**
     * The caption for the panel.
     */
    caption: string;

    /**
     * The value for the panel.
     */
    value: string | undefined;

    /**
     * The icon to display.
     */
    icon: ReactNode;

    /**
     * The background style for the icon.
     */
    backgroundStyle: "green" | "orange" | "blue" | "purple";

    /**
     * Class names.
     */
    className?: string;
}
