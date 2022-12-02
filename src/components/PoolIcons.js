import React from 'react';
import { OutletContext } from '../pages/Layout';
import CryptoIcon from './CryptoIcon';

export default class PoolIcons extends React.Component {

    static contextType = OutletContext;

    constructor(props) {
        super(props);
        this.state = {};
    }

    render() { 
        return this.props.pool?.tokens
            .filter(token => token.address !== this.props.pool.address)
            .map(token =>
                <span key={token.id} className="me-1">
                    <CryptoIcon name={token.symbol} />
                </span>
            );
    }
}