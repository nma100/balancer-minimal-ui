import React from 'react';
import { OutletContext } from '../pages/Layout';
import { amount } from '../utils/page';

const PLACEHOLDER = { width: '2rem' };

export default class PoolShares extends React.Component {

    static contextType = OutletContext;

    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        const { shares } = this.props.pool;
        return shares === undefined ? 
                <span className='placeholder-glow'>
                    <span className='placeholder' style={PLACEHOLDER}></span>
                </span>
                : <>{amount(shares)}</>;
    }
}