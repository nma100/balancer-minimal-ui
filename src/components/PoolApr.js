import React from 'react';

export default class PoolApr extends React.Component {

    constructor(props) {
        super(props);
        this.state = {};
        console.log("PoolApr", props);
    }

    async componentDidMount() {
        console.log("componentDidMount apr", this.state);
        const apr = await this.props.context.balancer.loadApr(this.props.pool);
        console.log("apr", apr);
        this.setState({ apr: (parseFloat(apr.min) / 100) })
    }

    render() {
        console.log('render apr', this.state);
        return <>
            {this.state.apr !== undefined
                ? <>{this.state.apr}%</>
                : <>—</>
            }
        </>;
    }
}