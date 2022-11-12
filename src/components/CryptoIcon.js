import React from 'react';
import CryptoIcons from 'nma-cryptocurrency-icons/manifest.json';
import { isDark } from '../theme';
import { OutletContext } from '../pages/Layout';

const LIGHT = 'generic-0', DARK = 'generic-5';

export default class CryptoIcon extends React.Component {

    static contextType = OutletContext;

    constructor(props) {
        super(props);
        this.state = { icon: undefined, name: undefined };
    }

    async fetchIcon(name) {
        let symbol = isDark(this.context.theme) ? DARK : LIGHT;
        if (CryptoIcons.find(o => o.symbol === name?.toUpperCase())) {
            symbol = name.toLowerCase();
        } 
        const icon = await import(`nma-cryptocurrency-icons/svg/icon/${symbol}.svg`);
        return {
            symbol: name.toUpperCase(),
            icon: icon.default
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
        return <img src={icon} alt={name} title={name} />;
    }
}