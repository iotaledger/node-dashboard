import classNames from "classnames";
import React, { Component, ReactNode } from "react";
import { FormatHelper } from "../../../utils/formatHelper";
import { ReactComponent as DropdownIcon } from "./../../../assets/dropdown-arrow.svg";
import MigratedFund from "./MigratedFund";
import { ReceiptMilestoneOptionProps } from "./ReceiptMilestoneOptionProps";
import { ReceiptMilestoneOptionState } from "./ReceiptMilestoneOptionState";

/**
 * Component which will display a receipt milestone option.
 */
class ReceiptMilestoneOption extends Component<ReceiptMilestoneOptionProps, ReceiptMilestoneOptionState> {
    /**
     * Create a new instance of Receipt milestone option.
     * @param props The props.
     */
    constructor(props: ReceiptMilestoneOptionProps) {
        super(props);

        this.state = {
            formatFull: false,
            showReceiptDetails: false
        };
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="milestone-payload_receipt padding-t-s">
                <div
                    className="card--content__input"
                    onClick={() => this.setState({ showReceiptDetails: !this.state.showReceiptDetails })}
                >

                    <div className={classNames(
                            "margin-r-t",
                            "card--content__input--dropdown",
                            { "opened": this.state.showReceiptDetails }
                        )}
                    >
                        <DropdownIcon />
                    </div>
                    <h3 className="card--content__input--label">
                        Receipt
                    </h3>
                </div>
                {this.state.showReceiptDetails && (
                    <div className="card--content--border-l">
                        <div className="card--label">
                            Migrated At
                        </div>
                        <div className="card--value row">
                            {this.props.option.migratedAt}
                        </div>
                        <div className="card--label">
                            Final
                        </div>
                        <div className="card--value row">
                            {this.props.option.final ? "Yes" : "No"}
                        </div>
                        {this.props.option.funds.map((fund, idx) => (
                            <MigratedFund fund={fund} index={idx} key={idx} />
                        ))}
                        <div className="card--label">
                            Input Transaction Milestone Id
                        </div>
                        <div className="card--value card--value__mono">
                            {this.props.option.transaction.input.milestoneId}
                        </div>
                        <div className="card--label">
                            Output Transaction Amount to Treasury
                        </div>
                        <div className="card--value card--value__mono">
                            <button
                                className="card--value--button"
                                type="button"
                                onClick={() => this.setState(
                                    {
                                        formatFull: !this.state.formatFull
                                    }
                                )}
                            >
                                {FormatHelper.getInstance().amount(
                                    Number(this.props.option.transaction.output.amount),
                                    this.state.formatFull
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default ReceiptMilestoneOption;
