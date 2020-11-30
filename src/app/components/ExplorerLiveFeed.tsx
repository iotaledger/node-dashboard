import * as React from 'react';
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import NodeStore from "app/stores/NodeStore";
import {inject, observer} from "mobx-react";
import Card from "react-bootstrap/Card";
import ExplorerStore from "app/stores/ExplorerStore";
import Table from "react-bootstrap/Table";
import * as style from '../../assets/main.css';

interface Props {
    nodeStore?: NodeStore;
    explorerStore?: ExplorerStore;
}

@inject("nodeStore")
@inject("explorerStore")
@observer
export class ExplorerLiveFeed extends React.Component<Props, any> {
    updateInterval: any;

    constructor(props: Readonly<Props>) {
        super(props);
        this.state = {
            topicsRegistered: false,
        };
    }

    componentDidMount(): void {
        this.updateInterval = setInterval(() => this.updateTick(), 500);
    }

    componentWillUnmount(): void {
        clearInterval(this.updateInterval);
        this.setState({topicsRegistered: false})
    }

    updateTick = () => {
        if (this.props.nodeStore.websocketConnected && !this.state.topicsRegistered) {
            this.setState({topicsRegistered: true})
        }

        if (!this.props.nodeStore.websocketConnected && this.state.topicsRegistered) {
            this.setState({topicsRegistered: false})
        }
    }

    render() {
        let {mssLiveFeed} = this.props.explorerStore;
        return (
            <Row className={"mb-3"}>
                <Col>
                    <Card>
                        <Card.Body>
                            <Card.Title>Live Feed</Card.Title>
                            <Row className={"mb-3"}>
                                <Col md={6} xs={12}>
                                    <h6>Milestones</h6>
                                    <Table responsive>
                                        <thead>
                                        <tr>
                                            <td>#</td>
                                            <td>Hash</td>
                                        </tr>
                                        </thead>
                                        <tbody className={style.monospace}>
                                        {mssLiveFeed}
                                        </tbody>
                                    </Table>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        );
    }
}
