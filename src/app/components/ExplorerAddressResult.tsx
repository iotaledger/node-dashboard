import * as React from 'react';
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import NodeStore from "app/stores/NodeStore";
import {inject, observer} from "mobx-react";
import ExplorerStore from "app/stores/ExplorerStore";
import Spinner from "react-bootstrap/Spinner";
import ListGroup from "react-bootstrap/ListGroup";
import {Link} from 'react-router-dom';
import Alert from "react-bootstrap/Alert";
import Badge, {BadgeProps} from "react-bootstrap/Badge";
import {IOTAValue} from "app/components/IOTAValue";
import FormCheck from "react-bootstrap/FormCheck";
import * as style from '../../assets/main.css';

interface Props {
    nodeStore?: NodeStore;
    explorerStore?: ExplorerStore;
    match?: {
        params: {
            hash: string,
        }
    }
}

interface State {
    valueOnly: boolean
}

@inject("nodeStore")
@inject("explorerStore")
@observer
export class ExplorerAddressQueryResult extends React.Component<Props, State> {

    state: State = {
        valueOnly: this.props.explorerStore.valueOnly
    }

    componentDidMount() {
        this.props.explorerStore.resetSearch();
        this.props.explorerStore.searchAddress(this.props.match.params.hash);
    }

    getSnapshotBeforeUpdate(prevProps: Props, prevState) {
        if (prevProps.match.params.hash !== this.props.match.params.hash || prevState.valueOnly != this.state.valueOnly) {
            this.props.explorerStore.searchAddress(this.props.match.params.hash);
        }
        return null;
    }

    handleValueOnlyChange = () => {
        this.props.explorerStore.toggleValueOnly()
        this.setState({valueOnly: this.props.explorerStore.valueOnly})
    }

    render() {
        let {hash} = this.props.match.params;
        let {addr, query_loading} = this.props.explorerStore;
        let txsEle = [];
        if (addr) {
            for (let i = 0; i < addr.msgsMeta.length; i++) {
                let msg = addr.msgsMeta[i];

                let badgeVariant: BadgeProps["variant"] = "secondary";
                /*
                if (msg.value < 0) {
                    badgeVariant = "danger";
                } else if (msg.value > 0) {
                    badgeVariant = "success";
                }
                */

               // ToDo: add value
               txsEle.push(
                   <ListGroup.Item key={msg.messageId}
                   className="d-flex justify-content-between align-items-center">
                        <small>
                            <Link className={style.monospace} to={`/explorer/msgs/${msg.messageId}`}>{msg.messageId}</Link>
                        </small>
                    <Badge variant={badgeVariant}><IOTAValue>0</IOTAValue></Badge>
                    </ListGroup.Item>
                );
            }
        }
        return (
            <Container fluid className={`text-break`}>
                <h3>Address</h3>
                <p>
                    <span className={style.monospace}> {hash} {' '} </span>
                </p>
                {
                    addr !== null ?
                        <React.Fragment>
                            <p>
                                Balance: <IOTAValue>{addr.balance}</IOTAValue>
                            </p>
                            {
                                addr.msgsMeta !== null && addr.msgsMeta.length === 100 &&
                                <Alert variant={"warning"}>
                                    Max. {addr.msgsMeta.length} messages are shown.
                                </Alert>
                            }
                            <Row className={"mb-3"}>
                                <Col>
                                    <ListGroup variant={"flush"}>
                                        <ListGroup.Item key={"row-check-value-only"}
                                                        variant={"secondary"}
                                                        className="d-flex justify-content-between align-items-center">
                                            <div
                                                className="d-flex align-items-center font-weight-bold">Messages &nbsp;
                                                <Badge
                                                    pill
                                                    variant={"secondary"}
                                                    className={"align-middle"}>{addr.msgsMeta.length}</Badge>
                                            </div>
                                            <FormCheck id={"check-value-only"}
                                                       label={"Only show value Tx"}
                                                       type={"switch"}
                                                       checked={this.props.explorerStore.valueOnly}
                                                       onChange={this.handleValueOnlyChange}
                                            />
                                        </ListGroup.Item>
                                        {txsEle}
                                    </ListGroup>
                                </Col>
                            </Row>
                        </React.Fragment>
                        :
                        <Row className={"mb-3"}>
                            <Col>
                                {
                                    query_loading && <Spinner animation="border"/>
                                }
                            </Col>
                        </Row>
                }

            </Container>
        );
    }
}
