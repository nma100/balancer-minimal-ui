/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";
import * as ReactDOMServer from "react-dom/server";
import { Tooltip } from "bootstrap";
import { OutletContext } from "../pages/Layout";
import { isDark } from "../theme";
import { isEthNetwork } from "../networks";
import { UNAVAILABLE } from "../utils/page";

export default class PoolApr extends React.Component {
  
  static contextType = OutletContext;

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.setState({ apr: undefined }); 
  }

  componentDidUpdate() {
    const { balancer } = this.context;
    const { pool } = this.props;
    const { apr }  = this.state;
    if (balancer !== undefined && apr === undefined) {
        balancer.loadApr(pool)
            .then(apr => this.setState({ apr }))
            .catch(() => this.setState({ apr: false }));
    }
    document
      .querySelectorAll('.apr-breakdown')
      .forEach(el => new Tooltip(el, { html: true }));
  }

  loading() {
    const { chainId } = this.context;
    const css = isEthNetwork(chainId) ? 'apr-eth' : 'apr';
    return (
      <span className="placeholder-glow">
        <span className={`${css} placeholder`}></span>
      </span>
    );
  }

  render() {
    const { pool } = this.props;
    const { apr  } = this.state;

    if (apr === undefined) return this.loading();
    if (apr === false) return UNAVAILABLE;

    const swapFees = apr?.swapFees;
    const stakingApr = apr?.stakingApr;
    const protocolApr = apr?.protocolApr;
    const tokenApr = apr?.tokenAprs?.total;
    const rewardApr = apr?.rewardAprs?.total;

    const p = (apr) => `${parseFloat(apr) / 100}%`;

    let totalApr;
    if (apr.min === apr.max) {
      totalApr = `${p(apr.min)}`;
    } else {
      totalApr = `${p(apr.min)} - ${p(apr.max)}`;
    }

    const breakdown = ReactDOMServer.renderToStaticMarkup(
      <div className="px-3 pt-3 pb-2 text-start">
        <p>
          <strong>Total APR</strong> : {totalApr}
        </p>
        <p>Swap fees : {p(swapFees)}</p>
        {stakingApr?.min > 0 && 
          <p>
            Staking APR : 
            { stakingApr.min === stakingApr.max ?
              <span className="ps-1">{ p(stakingApr.min) }</span>
              :
              <span className="ps-1">{ p(stakingApr.min)} - {p(stakingApr.max)}</span>
            }
          </p>
        }
        {rewardApr > 0 && <p>Reward APR : {p(rewardApr)}</p>}
        {tokenApr > 0 && <p>Token APR : {p(tokenApr)}</p>}
        {protocolApr > 0 && <p>Protocol APR : {p(protocolApr)}</p>}
      </div>
    );

    const textClass = isDark(this.context.theme) ? 'text-white' : 'text-black';

    let icon;
    if (this.context.balancer.veBalPoolId() === pool.id) {
      icon = <i className="bi bi-stars text-primary"></i>;
    } else if (stakingApr?.min > 0 || rewardApr > 0 || tokenApr > 0 || protocolApr > 0) {
      icon = <i className="bi bi-stars text-warning"></i>;
    } else {
      icon = <i className={`bi bi-info-circle ${textClass} text-opacity-75`}></i>;
    }

    const tooltip = (
      <a href="#" className="apr-breakdown" data-bs-toggle="tooltip" data-bs-title={breakdown} onClick={e => e.preventDefault()}>
        {icon}
      </a>
    );

    return <><span className="pe-1">{totalApr}</span> {tooltip}</>;
  }
}
