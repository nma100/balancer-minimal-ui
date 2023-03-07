import React from 'react';
import { OutletContext } from '../pages/Layout';
import { bn } from '../utils/bn';
import { usd } from '../utils/page';

export default class PoolVolume  extends React.Component {

    static contextType = OutletContext;

    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        this.setState({ volume: undefined }); 
    }

    componentDidUpdate() {
        const { balancer } = this.context;
        const { pool } = this.props;
        const { volume }  = this.state;
        if (balancer !== undefined && volume === undefined) {
            balancer.loadVolume(pool)
                .then((v) => this.setState({ volume: bn(v) }))
                .catch(() => this.setState({ volume: false }));
        }
    }

    render() {
        const { volume } = this.state;
        return volume === undefined ? (
            <span className='placeholder-glow'>
                <span className='volume placeholder'></span>
            </span>
        ) : <>{ usd(volume, true) }</>;
    }
}