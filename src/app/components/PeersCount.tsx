import * as React from 'react';
import NodeStore from 'app/stores/NodeStore';
import { inject, observer } from 'mobx-react';

interface Props {
  nodeStore?: NodeStore;
}

@inject('nodeStore')
@observer
export default class PeersCount extends React.Component<Props, any> {
  render() {
    return (
      <React.Fragment>
        Connected Peers:{' '}
        {this.props.nodeStore.status.connected_peers_count}
      </React.Fragment>
    );
  }
}
