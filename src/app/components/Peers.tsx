import * as React from 'react';
import Container from "react-bootstrap/Container";
import NodeStore from "app/stores/NodeStore";
import {inject, observer} from "mobx-react";
import {Peer} from "app/components/Peer";

interface Props {
    nodeStore?: NodeStore;
}

@inject("nodeStore")
@observer
export class Peers extends React.Component<Props, any> {
    updateInterval: any;

    constructor(props: Readonly<Props>) {
        super(props);
        this.state = {
            topicsRegistered: false,
        };
    }

    componentDidMount(): void {
        this.updateInterval = setInterval(() => this.updateTick(), 500);
        this.props.nodeStore.registerPeerTopics();
    }

    componentWillUnmount(): void {
        clearInterval(this.updateInterval);
        this.props.nodeStore.unregisterPeerTopics();
    }

    updateTick = () => {
        if (this.props.nodeStore.websocketConnected && !this.state.topicsRegistered) {
            this.props.nodeStore.registerPeerTopics();
            this.setState({topicsRegistered: true})
        }

        if (!this.props.nodeStore.websocketConnected && this.state.topicsRegistered) {
            this.setState({topicsRegistered: false})
        }
    }

    render() {
        let peersEle = [];
        this.props.nodeStore.peer_metrics.forEach((v, k) => {
            peersEle.push(<Peer key={k} identity={k}/>);
        });
        return (
            <Container fluid>
                <h3>Peers {peersEle.length > 0 && <span>({peersEle.length})</span>}</h3>
                <p>
                    Currently connected and disconnected peers known to the node.
                </p>
                {peersEle}
            </Container>
        );
    }
}
