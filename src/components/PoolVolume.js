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

    async componentDidMount() {
        try {
          const { pool } = this.props;
          const { balancer } = this.context;
          const volume = await balancer.loadVolume(pool);
          this.setState({ volume: bn(volume) }); 
        } catch (e) {
          this.setState({ volume: false }); 
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