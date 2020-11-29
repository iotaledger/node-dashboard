import * as React from 'react';
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import {Nav, OverlayTrigger, Tab, Tooltip} from "react-bootstrap";
import NodeStore from "app/stores/NodeStore";
import {inject, observer} from "mobx-react";
import ExplorerStore from "app/stores/ExplorerStore";
import Spinner from "react-bootstrap/Spinner";
import ListGroup from "react-bootstrap/ListGroup";
import Badge from "react-bootstrap/Badge";
import * as dateformat from 'dateformat';
import {Link} from 'react-router-dom';
import {If} from 'tsx-control-statements/components';
import ReactJson from 'react-json-view';
import Alert from "react-bootstrap/Alert";
import {CopyToClipboard} from 'react-copy-to-clipboard';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCheck, faClipboard, faClipboardCheck, faCode} from '@fortawesome/free-solid-svg-icons';

import * as style from '../../assets/main.css';
import {IOTAValue} from "app/components/IOTAValue";

interface Props {
    nodeStore?: NodeStore;
    explorerStore?: ExplorerStore;
    match?: {
        params: {
            hash: string,
        }
    }
}

const tooltip_id = (
    <Tooltip id="tooltip_id">
        Copy message ID
    </Tooltip>
);

const tooltip_bytes = (
    <Tooltip id="tooltip_bytes">
        Copy message raw bytes
    </Tooltip>
);

@inject("nodeStore")
@inject("explorerStore")
@observer
export class ExplorerMessageQueryResult extends React.Component<Props, any> {

    componentDidMount() {
        this.props.explorerStore.resetSearch();
        this.props.explorerStore.searchMsg(this.props.match.params.hash);
    }

    getSnapshotBeforeUpdate(prevProps: Props, prevState) {
        if (prevProps.match.params.hash !== this.props.match.params.hash) {
            this.props.explorerStore.searchMsg(this.props.match.params.hash);
        }
        return null;
    }

    state = {
        copied_hash: false,
        copied_raw: false,
    };

    render() {
        let {hash} = this.props.match.params;
        let {msgMeta, query_loading, query_err} = this.props.explorerStore;
        let childrenEle = [];
        if (msgMeta) {
            // ToDo: add children
            /*
            if (msgMeta.children) {
                for (let i = 0; i < msgMeta.children.length; i++) {
                    let childrenHash = msgMeta.children[i];
                    childrenEle.push(
                        <ListGroup.Item>
                            <small>
                                <Link to={`/explorer/msgs/${childrenHash}`}>{childrenHash}</Link>
                            </small>
                        </ListGroup.Item>
                    );
                }
            }
            */
        }
        return (
            <Container fluid>
                <If condition={query_err !== null}>
                    <Alert variant={"warning"}>
                        Requested message unknown on this node!
                    </Alert>
                </If>
                <If condition={query_err === null}>
                    <h3>
                        {
                            msgMeta ?
                                <span>
                                {
                                    msgMeta.is_milestone ?
                                        <span>Milestone {msgMeta.milestone_index}</span> :
                                        'Message'
                                }
                            </span>
                                :
                                <span>Message</span>
                        }
                    </h3>
                    <p className={`text-break`}>
                        <span className={style.monospace}> {hash} {' '} </span>
                        {
                            msgMeta &&
                            <React.Fragment>
                                <OverlayTrigger placement="bottom" overlay={tooltip_id}>
                                    <CopyToClipboard text={hash} onCopy={() => {
                                        this.setState({copied_hash: true});
                                        const timer_hash = setTimeout(() => {
                                            this.setState({copied_hash: false});
                                        }, 1000);
                                        return () => clearTimeout(timer_hash);
                                    }
                                    }>
                                        {this.state.copied_hash ? <FontAwesomeIcon icon={faClipboardCheck}/> :
                                            <FontAwesomeIcon icon={faClipboard}/>}
                                    </CopyToClipboard>
                                </OverlayTrigger>
                                {' '}
                                <OverlayTrigger placement="bottom" overlay={tooltip_bytes}>
                                    <CopyToClipboard text={msgMeta.raw_trytes} onCopy={() => {
                                        this.setState({copied_raw: true});
                                        const timer_raw = setTimeout(() => {
                                            this.setState({copied_raw: false});
                                        }, 1000);
                                        return () => clearTimeout(timer_raw);
                                    }
                                    }>
                                        {this.state.copied_raw ? <FontAwesomeIcon icon={faCheck}/> :
                                            <FontAwesomeIcon icon={faCode}/>}
                                    </CopyToClipboard>
                                </OverlayTrigger>
                                <br/>
                                <span>
                                    {
                                        msgMeta.isSolid ?
                                            <Badge variant="primary">Solid</Badge>
                                            :
                                            <Badge variant="light">Unsolid</Badge>
                                    }
                                    {' '}
                                    {
                                        msgMeta.is_milestone ?
                                            msgMeta.referenced.state ?
                                                <Badge variant="success">
                                                    Referenced
                                                </Badge>
                                                :
                                                <Badge variant="primary">Valid</Badge>
                                            :
                                            msgMeta.referenced.state ?
                                                msgMeta.referenced.conflicting ?
                                                    <Badge variant="danger">
                                                        Conflicting at Milestone {msgMeta.referenced.milestone_index}
                                                    </Badge>
                                                    :
                                                    <Badge variant="success">
                                                        Referenced by Milestone {msgMeta.referenced.milestone_index}
                                                    </Badge>
                                                :
                                                <Badge variant="light">Unreferenced</Badge>
                                    }
                            </span>
                            </React.Fragment>
                        }
                    </p>
                    <Row className={"mb-3"}>
                        <Col>
                            {
                                query_loading && <Spinner animation="border"/>
                            }
                        </Col>
                    </Row>
                    {
                        msgMeta &&
                        <React.Fragment>
                            <Row className={"mb-3"}>
                                <Col>
                                    <ListGroup>
                                        <ListGroup.Item className="text-break">
                                            Parent 1: {' '}
                                            <Link to={`/explorer/msgs/${msgMeta.parent1MessageId}`} className={style.monospace}>
                                                {msgMeta.parent1MessageId}
                                            </Link>
                                        </ListGroup.Item>
                                    </ListGroup>
                                </Col>
                                <Col>
                                    <ListGroup>
                                        <ListGroup.Item className="text-break">
                                            Parent 2: {' '}
                                            <Link to={`/explorer/msgs/${msgMeta.parent2MessageId}`} className={style.monospace}>
                                                {msgMeta.parent2MessageId}
                                            </Link>
                                        </ListGroup.Item>
                                    </ListGroup>
                                </Col>
                            </Row>
                            <Row className={"mb-3"}>
                                <Col>
                                    <ListGroup>
                                        // todo MWM
                                        <ListGroup.Item>MWM: 0</ListGroup.Item>
                                    </ListGroup>
                                </Col>
                            </Row>

                            <Row className={"mb-3"}>
                                <Col>
                                    <ListGroup>
                                        <ListGroup.Item className="text-break">
                                            Address: {' '}
                                            <Link to={`/explorer/addr/${msgMeta.address}`} className={style.monospace}>
                                                {msgMeta.address}
                                            </Link>
                                        </ListGroup.Item>
                                        <ListGroup.Item className={style.monospace}>
                                            Nonce: {msgMeta.nonce}
                                        </ListGroup.Item>
                                        <ListGroup.Item className="text-break">
                                            Message:<br/>
                                            <Tab.Container id="left-tabs-message" defaultActiveKey="trytes">
                                                <Row>
                                                    <Col sm={3}>
                                                        <Nav variant="pills" className="flex-column">
                                                            <Nav.Item>
                                                                <Nav.Link eventKey="trytes">Trytes</Nav.Link>
                                                            </Nav.Item>
                                                            <Nav.Item>
                                                                <Nav.Link eventKey="text">Text</Nav.Link>
                                                            </Nav.Item>
                                                            <If condition={msgMeta.json_obj !== undefined}>
                                                                <Nav.Item>
                                                                    <Nav.Link eventKey="json">JSON</Nav.Link>
                                                                </Nav.Item>
                                                            </If>
                                                        </Nav>
                                                    </Col>
                                                    <Col sm={9}>
                                                        <Tab.Content className={style.monospace}>
                                                            <Tab.Pane eventKey="trytes">
                                                                <small>
                                                                    {msgMeta.signature_message_fragment}
                                                                </small>
                                                            </Tab.Pane>
                                                            <Tab.Pane eventKey="text">
                                                                <If condition={msgMeta.ascii_message !== undefined}>
                                                                    {msgMeta.ascii_message}
                                                                </If>
                                                            </Tab.Pane>
                                                            <If condition={msgMeta.json_obj !== undefined}>
                                                                <Tab.Pane eventKey="json">
                                                                    <ReactJson src={msgMeta.json_obj} name={false}
                                                                               theme="eighties"/>
                                                                </Tab.Pane>
                                                            </If>
                                                        </Tab.Content>
                                                    </Col>
                                                </Row>
                                            </Tab.Container>
                                        </ListGroup.Item>
                                        <ListGroup.Item className="text-break">
                                            Children: {' '}
                                            <If condition={childrenEle.length > 0}>
                                                <ListGroup variant="flush" className={style.monospace}>
                                                    {childrenEle}
                                                </ListGroup>
                                            </If>
                                            <If condition={childrenEle.length === 0}>
                                                No children yet
                                            </If>
                                        </ListGroup.Item>
                                    </ListGroup>
                                </Col>
                            </Row>
                        </React.Fragment>
                    }
                </If>
            </Container>
        );
    }
}
