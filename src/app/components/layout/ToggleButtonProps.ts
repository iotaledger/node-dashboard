export interface ToggleButtonProps {
    /**
     * Is the button checked.
     */
    value: boolean;

    /**
     * The value changed.
     */
    onChanged(value: boolean): void;
}
