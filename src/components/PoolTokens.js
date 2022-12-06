import React from 'react';
import { OutletContext } from '../pages/Layout';
import { isDark } from '../theme';

export default class PoolTokens extends React.Component {

    static contextType = OutletContext;

    constructor(props) {
        super(props);
        this.state = {};
    }

    css() {
        const { theme } = this.context;
        const bgClass = isDark(theme) ? 'bg-light' : 'bg-dark';
        const textClass = isDark(theme) ? 'text-light' : 'text-dark';
        return { bgClass, textClass };
    }

    render() {
        const { pool } = this.props;
        const { bgClass, textClass } = this.css();
        const format = val => (parseFloat(val) * 100).toFixed();
        return pool.tokens
                .filter(token => token.address !== pool.address)
                .map(token => token.weight ?
                    <div key={token.id} className={`d-inline-flex align-items-center ${bgClass} bg-opacity-10 text-nowrap px-2 py-1 me-2 rounded`}>
                        <div className="me-1">{token.symbol}</div><div className={`${textClass} text-opacity-75`} style={{ fontSize: '70%' }}>{format(token.weight)}%</div>
                    </div>
                    : <span key={token.id} className={`${bgClass} bg-opacity-10 px-2 py-1 me-1 rounded-pill`}>{token.symbol}</span>
                );
    }
}