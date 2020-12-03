import React, { ReactNode } from "react";
import { Link, RouteComponentProps } from "react-router-dom";
import { ReactComponent as ChevronLeftIcon } from "../../../assets/chevron-left.svg";
import { ReactComponent as ChevronRightIcon } from "../../../assets/chevron-right.svg";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { TangleService } from "../../../services/tangleService";
import { ClipboardHelper } from "../../../utils/clipboardHelper";
import { FormatHelper } from "../../../utils/formatHelper";
import AsyncComponent from "../../components/layout/AsyncComponent";
import MessageButton from "../../components/layout/MessageButton";
import "./Milestone.scss";
import { MilestoneRouteProps } from "./MilestoneRouteProps";
import { MilestoneState } from "./MilestoneState";

/**
 * Component which will show the milestone page.
 */
class Milestone extends AsyncComponent<RouteComponentProps<MilestoneRouteProps>, MilestoneState> {
    /**
     * Service for tangle requests.
     */
    private readonly _tangleService: TangleService;

    /**
     * Create a new instance of Milestone.
     * @param props The props.
     */
    constructor(props: RouteComponentProps<MilestoneRouteProps>) {
        super(props);

        this._tangleService = ServiceFactory.get<TangleService>("tangle");

        this.state = {
            nextIndex: -1,
            previousIndex: -1,
            hasPrevious: false,
            hasNext: false
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        super.componentDidMount();

        await this.loadIndex(this.props.match.params.milestoneIndex, false);
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="milestone">
                <div className="content">
                    <Link
                        to="/explorer"
                        className="row"
                    >
                        <ChevronLeftIcon className="secondary" />
                        <h3 className="secondary margin-l-s">Back to Explorer</h3>
                    </Link>
                    <div className="card margin-t-m padding-l">
                        <h2>Milestone</h2>
                        <div className="card--label">
                            Index
                        </div>
                        <div className="card--value">
                            {this.state.milestone?.milestoneIndex}
                        </div>
                        <div className="card--label">
                            Message Id
                        </div>
                        <div className="card--value card--value__mono row">
                            <span className="margin-r-t">
                                <Link
                                    to={`/explorer/message/${this.state.milestone?.messageId}`}
                                    className="info-box--title linked"
                                >
                                    {this.state.milestone?.messageId}
                                </Link>

                            </span>
                            <MessageButton
                                onClick={() => ClipboardHelper.copy(
                                    this.state.milestone?.messageId
                                )}
                                buttonType="copy"
                                labelPosition="top"
                            />
                        </div>
                        <div className="card--label">
                            Date
                        </div>
                        <div className="card--value">
                            {this.state.milestone?.timestamp && FormatHelper.date(
                                this.state.milestone?.timestamp
                            )}
                        </div>
                        {(this.state.hasPrevious || this.state.hasNext) && (
                            <React.Fragment>
                                <div className="card--label">
                                    Actions
                                </div>
                                <div className="row">
                                    <button
                                        disabled={!this.state.hasPrevious}
                                        type="button"
                                        onClick={async () =>
                                            this.loadIndex(this.state.previousIndex.toString(), true)}
                                        className="card--action margin-r-t"
                                    >
                                        <ChevronLeftIcon className="margin-r-t" />
                                        Previous Milestone
                                    </button>
                                    <button
                                        disabled={!this.state.hasNext}
                                        type="button"
                                        onClick={async () =>
                                            this.loadIndex(this.state.nextIndex.toString(), true)}
                                        className="card--action margin-r-t"
                                    >
                                        Next Milestone
                                        <ChevronRightIcon className="margin-l-t" />
                                    </button>
                                </div>
                            </React.Fragment>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Load the milestone with the given index.
     * @param index The index to load.
     * @param updateUrl Update the url.
     */
    private async loadIndex(index: string, updateUrl: boolean): Promise<void> {
        const result = await this._tangleService.search(index);

        if (result?.milestone) {
            this.setState({
                milestone: result.milestone
            }, async () => this.checkForAdjacentMilestones());

            if (updateUrl) {
                window.history.replaceState(
                    undefined,
                    window.document.title,
                    `/explorer/milestone/${index}`);
            }
        } else {
            this.props.history.replace(`/explorer/search/${index}`);
        }
    }

    /**
     * Check for the previous and next milestones.
     */
    private async checkForAdjacentMilestones(): Promise<void> {
        if (this.state.milestone) {
            const nextIndex = this.state.milestone.milestoneIndex + 1;
            const previousIndex = this.state.milestone.milestoneIndex - 1;
            let hasNext = false;
            let hasPrevious = false;

            if (previousIndex > 0) {
                const resultPrevious = await this._tangleService.search(previousIndex.toString());
                if (resultPrevious?.milestone) {
                    hasPrevious = true;
                }
            }

            const resultNext = await this._tangleService.search(nextIndex.toString());
            if (resultNext?.milestone) {
                hasNext = true;
            }

            this.setState({
                previousIndex,
                nextIndex,
                hasPrevious,
                hasNext
            });

            if (!hasNext) {
                setTimeout(async () => this.checkForAdjacentMilestones(), 5000);
            }
        }
    }
}

export default Milestone;
