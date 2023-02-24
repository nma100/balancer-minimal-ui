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
        const { pool } = this.props;
        const { balancer } = this.context;
        this.setState({ tvl: bn(pool.totalLiquidity) }); 
        balancer.loadLiquidity(pool)
          .then(l => this.setState({ tvl: bn(l)}))
          .catch(e => console.warn(e));
      }

    render() {
        const { tvl } = this.state;
        return <>{ usd(tvl, true) }</>;
    }
}