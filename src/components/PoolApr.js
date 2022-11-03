/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import * as Bootstrap from 'bootstrap';
import { OutletContext } from '../pages/Layout';

const ICON_SIZE = { fontSize: '90%' };
const APR_WIDTH = { width: '2rem' };

export default class PoolApr extends React.Component {

    static contextType = OutletContext;

    constructor(props) {
        super(props);
        this.state = {};
    }

    async componentDidMount() {
        const apr = await this.context.balancer.loadApr(this.props.pool);
        this.setState({ apr: apr });
    }

    componentDidUpdate() {
        document
            .querySelectorAll('.apr-breakdown')
            .forEach(el => new Bootstrap.Tooltip(el, { html: true }));
    }

    render() {
        const { apr, } = this.state;
        const { pool } = this.props;

        const isDark = (this.context.theme === 'dark');
        const textClass = isDark ? 'text-white' : 'text-black';

        const swapFees = apr?.swapFees;
        const stakingApr = apr?.stakingApr;
        const protocolApr = apr?.protocolApr;
        const tokenApr = apr?.tokenAprs?.total;
        const rewardApr = apr?.rewardAprs?.total;

        const p = apr => {
            const float = parseFloat(apr) / 100;
            const value = (isNaN(float) || !isFinite(float)) ? 0 : float;
            return `${value}%`;
        }

        let totalApr = null;
        if (apr) {
            if (apr.min === apr.max) {
                totalApr = `${p(apr.min)}`;
            } else {
                totalApr = `${p(apr.min)} - ${p(apr.max)}`;
            }
        }

        const breakdown = ReactDOMServer.renderToStaticMarkup(<>
            <div className='px-3 pt-3 pb-2 text-start'>
                <p><strong>Total APR</strong> : {totalApr}</p>
                <p>Swap fees : {p(swapFees)}</p>
                {stakingApr > 0 && <p>Staking APR : {p(stakingApr.min)} - {p(stakingApr.max)}</p>}
                {rewardApr > 0 && <p>Reward APR : {p(rewardApr)}</p>}
                {tokenApr > 0 && <p>Token APR : {p(tokenApr)}</p>}
                {protocolApr > 0 && <p>Protocol APR : {p(protocolApr)}</p>}
            </div>
        </>);

        let icon;
        if (this.context.balancer.veBalPoolId() === pool.id) {
            icon = <i className='bi bi-stars text-primary' style={ICON_SIZE}></i>;
        } else if (stakingApr > 0 || rewardApr > 0 || tokenApr > 0 || protocolApr > 0) {
            icon = <i className='bi bi-stars text-warning' style={ICON_SIZE}></i>;
        } else {
            icon = <i className={`bi bi-info-circle ${textClass} text-opacity-50`} style={ICON_SIZE}></i>;
        }

        const tooltip = <a href='#' className='apr-breakdown' data-bs-toggle='tooltip' data-bs-title={breakdown}>{icon}</a>;

        return <>
            {totalApr
                ? <><span className='pe-1'>{totalApr}</span> {tooltip}</>
                : <span className='placeholder-glow'><span className='placeholder' style={APR_WIDTH}></span></span>
            }
        </>;
    }
}
