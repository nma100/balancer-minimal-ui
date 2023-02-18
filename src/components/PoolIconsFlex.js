import React from 'react';
import { OutletContext } from '../pages/Layout';
import CryptoIcon from './CryptoIcon';

export default class PoolIconsFlex extends React.Component {

    static contextType = OutletContext;

    constructor(props) {
        super(props);
        this.state = {};
    }

    render() { 
        return ( 
            <div className="pool-icons d-flex justify-content-center flex-wrap">
                { this.props.pool?.tokens
                    .filter(token => token.address !== this.props.pool.address)
                    .map(token => <div key={token.id}><CryptoIcon name={token.symbol} /></div>) 
                }
            </div>
        );
    }
}