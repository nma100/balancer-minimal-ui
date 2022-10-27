import React from 'react';
import { bnumToStr } from '../utils/bnum';

const PRECISION = 3, UNKNOWN = 'N/A';

export default class PoolBoost extends React.Component {

    constructor(props) {
        super(props);
        this.state = {};
    }

    async componentDidMount() {
        const pool = this.props.pool;
        const { account, balancer } = this.props.context;

        const userBoosts = await balancer.userBoosts(account);

        let boost;
        if (userBoosts && userBoosts[pool.id]) {
            boost = bnumToStr(userBoosts[pool.id], PRECISION);
        } else {
            boost = UNKNOWN;
        }

        this.setState({ boost: boost });
    }

    render() {
        return <>
            {this.state.boost !== undefined
                ? <>x{this.state.boost}</>
                : <>—</>
            }
        </>;
    }
}