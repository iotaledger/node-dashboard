import classNames from "classnames";
import React, { Component, ReactNode } from "react";
import { ReactComponent as SearchIcon } from "../../../assets/search.svg";
import "./SearchInput.scss";
import { SearchInputProps } from "./SearchInputProps";
import { SearchInputState } from "./SearchInputState";

/**
 * Search Input panel.
 */
class SearchInput extends Component<SearchInputProps, SearchInputState> {
    /**
     * Create a new instance of SearchInput.
     * @param props The properties.
     */
    constructor(props: SearchInputProps) {
        super(props);

        this.state = {
            query: ""
        };
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div
                className={classNames(
                    "search-input",
                    { "search-input--compact": this.props.compact },
                    this.props.className
                )}
            >
                <button
                    type="button"
                    className="icon-button"
                    onClick={() => this.props.onSearch(this.state.query)}
                >
                    <SearchIcon />
                </button>
                <input
                    type="text"
                    value={this.state.query}
                    onChange={e => this.setState({ query: e.target.value })}
                    onKeyDown={e => {
                        if (e.keyCode === 13) {
                            this.props.onSearch(this.state.query);
                        }
                    }}
                    placeholder={
                        this.props.compact
                            ? "Search the Tangle"
                            : "Search messages, addresses, outputs, milestones, indexes"
                    }
                />
            </div>
        );
    }
}

export default SearchInput;
