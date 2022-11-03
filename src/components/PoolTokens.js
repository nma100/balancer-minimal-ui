import React from 'react';
import { OutletContext } from '../pages/Layout';

export default class PoolTokens extends React.Component {

    static contextType = OutletContext;

    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        const tokens = this.props.pool?.tokens;
        const format = val => (parseFloat(val) * 100).toFixed();
        const isDark = (this.context.theme === 'dark');
        const bgClass = isDark ? 'bg-light' : 'bg-dark';
        const textClass = isDark ? 'text-light' : 'text-dark';
        return <>
            {tokens.map(token => token.weight ?
                <div key={token.id} className={`d-inline-flex align-items-center ${bgClass} bg-opacity-10 text-nowrap px-2 py-1 me-2 rounded`}>
                    <div className="me-1">{token.symbol}</div><div className={`${textClass} text-opacity-75`} style={{ fontSize: '70%' }}>{format(token.weight)}%</div>
                </div>
                : <span key={token.id} className={`${bgClass} bg-opacity-10 px-2 py-1 me-1 rounded-pill`}>{token.symbol}</span>
            )}
        </>;
    }
}