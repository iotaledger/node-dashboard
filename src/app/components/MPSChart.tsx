import * as React from 'react';
import Card from "react-bootstrap/Card";
import NodeStore from "app/stores/NodeStore";
import {inject, observer} from "mobx-react";
import {Line} from "react-chartjs-2";
import {defaultChartOptions} from "app/misc/Chart";
import * as style from '../../assets/main.css';

interface Props {
    nodeStore?: NodeStore;
}

const lineChartOptions = Object.assign({
    scales: {
        xAxes: [{
            ticks: {
                autoSkip: true,
                maxTicksLimit: 8,
                fontSize: 8,
            },
            gridLines: {
                display: false
            }
        }],
        yAxes: [{
            gridLines: {
                display: false
            },
            ticks: {
                callback: function (value, index, values) {
                    return Math.abs(value);
                },
                fontSize: 10,
                maxTicksLimit: 4,
                beginAtZero: true,
            },
        }],
    },
    tooltips: {
        callbacks: {
            label: function (tooltipItem, data) {
                let label = data.datasets[tooltipItem.datasetIndex].label;
                return `${label} ${Math.abs(tooltipItem.value)}`;
            }
        }
    }
}, defaultChartOptions);

@inject("nodeStore")
@observer
export default class MPSChart extends React.Component<Props, any> {
    render() {
        return (
            <Card className={style.hornetCardEqual}>
                <Card.Body>
                    <Card.Title>Messages per second</Card.Title>
                    <small>
                        Incoming: {this.props.nodeStore.last_mps_metric.incoming}.
                        New: {this.props.nodeStore.last_mps_metric.new}.
                        Outgoing: {this.props.nodeStore.last_mps_metric.outgoing}.
                    </small>
                    <div className={style.hornetChart}>
                        <Line data={this.props.nodeStore.mpsSeries} options={lineChartOptions}/>
                    </div>
                </Card.Body>
            </Card>
        );
    }
}
