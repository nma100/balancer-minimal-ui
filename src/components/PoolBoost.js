import React from 'react';
import { bnumToStr } from '../utils/bnum';

export default class PoolBoost extends React.Component {

    constructor(props) {
        super(props);
        this.state = {};
        console.log("PoolBoost", props);
    }

    async componentDidMount() {
        console.log("componentDidMount boost", this.state);
        const { account, balancer } = this.props.context;
        const pool = this.props.pool;

        const userBoosts = await balancer.userBoosts(account);

        console.log("pool", pool);
        console.log("userBoosts", userBoosts);

        this.setState({ boost: userBoosts && userBoosts[pool.id] ? bnumToStr(userBoosts[pool.id], 3) : 'N/A' });
    }

    render() {
        console.log('render boost', this.state);
        return <>
            {this.state.boost !== undefined
                ? <>x{this.state.boost}</>
                : <>—</>
            }
        </>;
    }
}