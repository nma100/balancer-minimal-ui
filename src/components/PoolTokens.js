import React from 'react';

export default class PoolTokens extends React.Component {

    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        const tokens = this.props.pool?.tokens;
        return <>
            {tokens.map(token => token.weight ?
                <div key={token.id} className="d-inline-flex align-items-center bg-light bg-opacity-10 text-nowrap px-2 py-1 me-2 rounded">
                    <div className="me-1">{token.symbol}</div><div className="text-light text-opacity-75" style={{ fontSize: '70%' }}>{parseFloat(token.weight) * 100}%</div>
                </div>
                : <span key={token.id} className="bg-light bg-opacity-10 px-2 py-1 me-1 rounded-pill">{token.symbol}</span>
            )}
        </>;
    }
}