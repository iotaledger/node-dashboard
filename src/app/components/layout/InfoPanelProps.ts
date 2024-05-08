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
     * The style for the icon.
     */
    iconStyle: "green" | "orange" | "blue" | "purple" | "grey";

    /**
     * Class names.
     */
    className?: string;
}
