import { ReactNode } from "react";

/**
 * The props for the Dialog component.
 */
export interface DialogProps {
    /**
     * The title to show on the dialog.
     */
    title: string;

    /**
     * The child controls.
     */
    children?: ReactNode[] | ReactNode;

    /**
     * The dialog actions.
     */
    actions?: ReactNode[] | ReactNode;
}
