import React from 'react';
import { OutletContext } from '../pages/Layout';
import { bn } from '../utils/bn';
import { usd } from '../utils/page';

export default class PoolTvl  extends React.Component {

    static contextType = OutletContext;

    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        this.setState({ tvl: undefined }); 
    }

    componentDidUpdate() {
        const { balancer } = this.context;
        const { pool } = this.props;
        const { tvl }  = this.state;
        if (balancer !== undefined && tvl === undefined) {
            balancer.loadLiquidity(pool)
                .then(l => this.setState({ tvl: bn(l) }))
                .catch(e => console.warn(e));
        }
    }

    render() {
        const { pool } = this.props;
        const tvl = this.state.tvl || bn(pool.totalLiquidity);
        return <>{ usd(tvl, true) }</>;
    }
}