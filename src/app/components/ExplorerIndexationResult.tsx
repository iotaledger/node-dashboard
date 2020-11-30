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

@inject("nodeStore")
@inject("explorerStore")
@observer
export class ExplorerIndexationQueryResult extends React.Component<Props, any> {

    componentDidMount() {
        this.props.explorerStore.resetSearch();
        this.props.explorerStore.searchIndexation(this.props.match.params.hash);
    }

    getSnapshotBeforeUpdate(prevProps: Props, prevState) {
        if (prevProps.match.params.hash !== this.props.match.params.hash) {
            this.props.explorerStore.searchIndexation(this.props.match.params.hash);
        }
        return null;
    }

    render() {
        let {indexation, query_loading} = this.props.explorerStore;
        let txsEle = [];
        if (indexation) {
            for (let i = 0; i < indexation.msgsMeta.length; i++) {
                let msg = indexation.msgsMeta[i];
                txsEle.push(
                    <ListGroup.Item key={msg.messageId}>
                        <small>
                            <Link className={style.monospace} to={`/explorer/msgs/${msg.messageId}`}>{msg.messageId}</Link>
                        </small>
                    </ListGroup.Item>
                );
            }
        }
        return (
            <Container fluid className={`text-break`}>
                <h3>Tag {indexation !== null && <span>({indexation.msgsMeta.length} Messages)</span>}</h3>
                {
                    indexation !== null ?
                        <React.Fragment>
                            {
                                indexation.msgsMeta !== null && indexation.msgsMeta.length === 100 &&
                                <Alert variant={"warning"}>
                                    Max. 100 messages are shown.
                                </Alert>
                            }
                            <Row className={"mb-3"}>
                                <Col>
                                    <ListGroup variant={"flush"}>
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
