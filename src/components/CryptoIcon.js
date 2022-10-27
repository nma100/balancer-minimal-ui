import React from 'react';
import CryptoIcons from 'cryptocurrency-icons/manifest.json';

const DEFAULT = 'generic';

export default class CryptoIcon extends React.Component {

    constructor(props) {
        super(props);
        this.state = { icon: undefined, name: undefined };
    }

    async fetchIcon(symbol) {
        let _symbol = DEFAULT;
        if (CryptoIcons.find(o => o.symbol === symbol?.toUpperCase())) {
            _symbol = symbol.toLowerCase();
        } 
        const _icon = await import(`cryptocurrency-icons/svg/icon/${_symbol}.svg`);
        return {
            symbol: _symbol,
            icon: _icon.default
        }
    }

    componentDidMount() {
        this.fetchIcon(this.props.name)
            .then(data => this.setState({ 
                icon: data.icon, 
                name: data.symbol 
            }));
    }

    render() {
        const { icon, name } = this.state;
        return <img src={icon} alt={name} />;
    }
}