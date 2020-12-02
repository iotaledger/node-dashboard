export interface SearchInputProps {
    /**
     * Class names.
     */
    className?: string;

    /**
     * Display in compact mode.
     */
    compact: boolean;

    /**
     * The query to search for.
     */
    onSearch: (query: string) => void;
}
