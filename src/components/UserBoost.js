import React from 'react';
import { bnf } from '../utils/bn';
import { OutletContext } from '../pages/Layout';

const PRECISION = 3, UNKNOWN = 'N/A';

export default class UserBoost extends React.Component {

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
            boost = bnf(userBoosts[pool.id], PRECISION);
        } 

        this.setState({ boost });
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