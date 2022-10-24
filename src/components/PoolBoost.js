import React from 'react';

export default class PoolBoost extends React.Component {

    constructor(props) {
        super(props);
        this.state = {};
        console.log("PoolBoost", props);
    }

    async componentDidMount() {
        console.log("componentDidMount boost", this.state);
        this.setState({ boost: '---' })
    }

    render() {
        console.log('render boost', this.state);
        return this.state.boost;
    }
}