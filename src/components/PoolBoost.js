import React from 'react';
import { bnumf } from '../utils/bnum';
import { OutletContext } from '../pages/Layout';

const PRECISION = 3, UNKNOWN = 'N/A';

export default class PoolBoost extends React.Component {

    static contextType = OutletContext;
   
    constructor(props) {
        super(props);
        this.state = {};
    }

    async componentDidMount() {
        const pool = this.props.pool;
        const { account, balancer } = this.context;

        const userBoosts = await balancer.userBoosts(account);

        let boost = UNKNOWN;
        
        if (userBoosts && userBoosts[pool.id]) {
            boost = bnumf(userBoosts[pool.id], PRECISION);
        } 

        this.setState({ boost: boost });
    }

    render() {
        const { boost } = this.state;
        return boost === undefined ? ( 
                <span className="placeholder-glow">
                    <span className="boost placeholder"></span>
                </span> 
            ) : <>x{boost}</>;
    }
}