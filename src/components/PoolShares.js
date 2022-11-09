import React from 'react';
import { OutletContext } from '../pages/Layout';
import { bnumf } from '../utils/bnum';

const PLACEHOLDER = { width: '2rem' };
const UNAVAILABLE = 'N/A';

export default class PoolShares extends React.Component {

    static contextType = OutletContext;

    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        const { shares } = this.props.pool;
        if (shares === false) return UNAVAILABLE;
        return <>
            {shares
                ? <>${bnumf(shares)}</>
                : <span className='placeholder-glow'>
                    <span className='placeholder' style={PLACEHOLDER}></span>
                </span>
            }
        </>;
    }
}