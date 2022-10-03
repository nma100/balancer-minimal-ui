import React from "react";
import { OutletContext } from "./Layout";
import { BalancerSDK } from '@balancer-labs/sdk';
import { getBptBalanceFiatValue } from "../utils/pools";
import { POOLS } from "../constants/pools";
import { bnum } from "../utils/bnum";

class Portfolio extends React.Component {

  static contextType = OutletContext;

  constructor(props) {
    console.log("constructor", props);
    super(props);
    this.state = { count: 0 };
  }

  componentDidMount() {
    console.log("componentDidMount", this.state);
  }

  async componentDidUpdate() {
    console.log("componentDidUpdate", this.state);

    if (this.context.account) {
      const stakedData = await this.loadStakedPools();
      console.log('stakedData', stakedData);

      const unstakedData = await this.loadUnstakedPools();
      console.log('unstakedData', unstakedData);

      const totalInvestedLabel = unstakedData.totalUnstakedAmount
          .plus(stakedData.totalStakedAmount);
      console.log('totalInvestedLabel', totalInvestedLabel.toString());
    }
  }

  initSdk() {
    const sdk = new BalancerSDK({ 
      network: Number(this.context.chainId),
      rpcUrl: `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`});
    console.log('sdk', this.context.account.toLowerCase(), sdk);  
    return sdk;
  }

  async loadUnstakedPools() {
    console.log("loadUnstakedPools");
    const sdk = this.initSdk();

    const { data } = sdk;

    const poolShares = await data.poolShares.query({ where: { userAddress: this.context.account.toLowerCase(),  balance_gt: "0" }});
    //console.log("poolShares", poolShares);

    const poolSharesIds = poolShares.map(poolShare => poolShare.poolId);
    //console.log("poolSharesIds", poolSharesIds);

    const pools = await data.pools.where(pool => poolSharesIds.includes(pool.id) && 
         !POOLS(this.context.chainId).ExcludedPoolTypes.includes(pool.poolType));

    // TODO : Phantom pools

    // TODO : Pool decorated. 

    const unstakedPools = pools.map(pool => {
      const stakedBpt = poolShares.find(ps => ps.poolId === pool.id); 
      return {
        ...pool,
        shares: getBptBalanceFiatValue(pool, stakedBpt.balance),
        bpt: stakedBpt.balance
    }});

    const totalUnstakedAmount = unstakedPools
      .map(pool => pool.shares)
      .reduce((total, shares) => total.plus(shares), bnum(0));

    // TODO Filter migratables pools
    
    //console.log("Unstaked pools", unstakedPools);
    //console.log("Total unstaked amount", totalUnstakedAmount);

    return { ...unstakedPools, totalUnstakedAmount }
  }

  async loadStakedPools() {
    console.log("loadStakedPools");
    const sdk = this.initSdk();

    const { data } = sdk;

    const gaugeShares = await data.gaugeShares.query({ where: { user: this.context.account.toLowerCase(), balance_gt: "0" } });
    //console.log('gaugeShares', gaugeShares);

    const stakedPoolIds = gaugeShares.map(share => share.gauge.poolId)
    //console.log('stakedPoolIds', stakedPoolIds);

    let stakedPools = await data.pools.where(pool => stakedPoolIds.includes(pool.id));
    //console.log('stakedPools', stakedPools);

    stakedPools = stakedPools.map(pool => {
      const stakedBpt = gaugeShares.find(gs => gs.gauge.poolId === pool.id);
      //console.log('stakedBpt', stakedBpt.balance);  
      return {
        ...pool,
        shares: getBptBalanceFiatValue(pool, stakedBpt.balance),
        bpt: stakedBpt.balance
      };
    });
    // TODO : pool boosts
    
    //console.log("Staked pools", stakedPools);

    const totalStakedAmount = stakedPools
      .map(pool => pool.shares)
      .reduce((total, shares) => total.plus(shares), bnum(0));

    return { ...stakedPools, totalStakedAmount }
  }

  render() {
    console.log("state", this.state);
    console.log("context", this.context);
    console.log("process.env", process.env);
    const logoSize = { width: "1.2rem", height: "1.2rem" };
    return (
      <>
          <div id="invest-info" className="bg-dark bg-gradient text-center rounded shadow py-2 mb-5">
            <div className="title fs-1">My Balancer investments</div>
            <div className="total fs-2 text-light text-opacity-75 fw-bold">----</div> 
            <div className="veBAL fs-3">---- in veBAL</div>
          </div>

          <h2 className="mb-4 pt-1 pt-xxl-2">My investments</h2>
          
          <div id="unstaked-pools" className="mb-5">
            <h4 className="mb-3">Unstaked pools</h4>
            <div className="table-responsive">
              <table className="table table-dark shadow-sm align-middle">
                <thead>
                  <tr>
                    <th scope="col" className="d-none d-md-table-cell"></th>
                    <th scope="col">Composition</th>
                    <th scope="col"><div className="text-nowrap">My balance</div></th>
                    <th scope="col"><div className="text-end text-nowrap">My APR</div></th>
                    <th scope="col"><div className="text-center text-nowrap">Actions</div></th>
                  </tr>
                </thead>
                <tbody>
                    {this.context.account
                        ? 
                          <>
                          <tr>
                            <td className="d-none d-md-table-cell px-3">
                              <img src="https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png" className="me-1" style={logoSize} alt="Asset icon" />
                              <img src="https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png" className="me-1" style={logoSize} alt="Asset icon" />
                              <img src="https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png" className="me-1" style={logoSize} alt="Asset icon" />
                            </td>
                            <td>
                              <span className="bg-light bg-opacity-10 px-2 py-1 me-1 rounded-pill">USDT</span>
                              <span className="bg-light bg-opacity-10 px-2 py-1 me-1 rounded-pill">DAI</span>
                              <span className="bg-light bg-opacity-10 px-2 py-1 rounded-pill">USDC</span>
                            </td>
                            <td>$4,089</td>
                            <td className="text-end text-nowrap"> &lt; 0.01% <i className="bi bi-info-circle text-white text-opacity-50" style={{fontSize: '90%'}}></i></td>
                            <td className="text-center text-white text-opacity-50 small">N/A</td>
                          </tr>
                          <tr>
                            <td className="d-none d-md-table-cell px-3">
                              <img src="https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png" className="me-1" style={logoSize} alt="Asset icon" />
                              <img src="https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png" className="me-1" style={logoSize} alt="Asset icon" />
                            </td>
                            <td>
                              <div className="d-inline-flex align-items-center bg-light bg-opacity-10 text-nowrap px-2 py-1 me-1 rounded"><div className="me-1">WETH</div><div className="text-light text-opacity-75" style={{fontSize: '70%'}}>50%</div></div>
                              <div className="d-inline-flex align-items-center bg-light bg-opacity-10 text-nowrap px-2 py-1 me-1 rounded"><div className="me-1">USDC</div><div className="text-light text-opacity-75" style={{fontSize: '70%'}}>50%</div></div>
                            </td>
                            <td>$454</td>
                            <td className="text-end text-nowrap">65.73% - 164.23% <i className="bi bi-stars text-warning" style={{fontSize: '90%'}}></i></td>
                            <td className="text-center"><button type="button" className="btn btn-outline-light btn-sm">Stake</button></td>
                          </tr>
                          </>
                        : <tr><td className="text-center p-3 fs-5 text-white text-opacity-50" colSpan="5">Connect your wallet</td></tr>
                    }
                </tbody>
              </table>
            </div>  
          </div>{/* Unstaked pools */}

          <div id="staked-pools" className="mb-5">
            <h4 className="mb-3">Staked pools</h4>
            <div className="table-responsive">
              <table className="table table-dark shadow-sm align-middle">
                <thead>
                  <tr>
                    <th scope="col" className="d-none d-md-table-cell"></th>
                    <th scope="col">Composition</th>
                    <th scope="col"><div className="text-nowrap">My balance</div></th>
                    <th scope="col"><div className="text-center text-nowrap">My boost</div></th>
                    <th scope="col"><div className="text-center text-nowrap">My APR</div></th>
                  </tr>
                </thead>
                <tbody>
                    {this.context.account
                        ? 
                          <>
                          <tr>
                            <td className="d-none d-md-table-cell px-3">
                              <img src="https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png" className="me-1" style={logoSize} alt="Asset icon" />
                              <img src="https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png" className="me-1" style={logoSize} alt="Asset icon" />
                            </td>
                            <td>
                              <div className="d-inline-flex align-items-center bg-light bg-opacity-10 text-nowrap px-2 py-1 me-2 rounded"><div className="me-1">WBTC</div><div className="text-light text-opacity-75" style={{fontSize: '70%'}}>50%</div></div>
                              <div className="d-inline-flex align-items-center bg-light bg-opacity-10 text-nowrap px-2 py-1 me-2 rounded"><div className="me-1">WETH</div><div className="text-light text-opacity-75" style={{fontSize: '70%'}}>50%</div></div>
                            </td>
                            <td>$1837</td>
                            <td className="text-center text-nowrap">1.021x</td>
                            <td className="text-center text-nowrap">162.91% <i className="bi bi-stars text-warning" style={{fontSize: '90%'}}></i></td>
                          </tr>
                          </>
                        : <tr><td className="text-center p-3 fs-5 text-white text-opacity-50" colSpan="5">Connect your wallet</td></tr>
                    }
                </tbody>
              </table>
            </div>
          </div>{/* Staked pools */}

          <div id="veBAL-liquidity">
              <h4 className="pool-title mb-3">veBAL protocol liquidity</h4>
              <div className="table-responsive">
                <table className="table table-dark shadow-sm align-middle">
                  <thead>
                    <tr>
                      <th scope="col" className="d-none d-md-table-cell"></th>
                      <th scope="col">Composition</th>
                      <th scope="col"><div className="text-nowrap">My balance</div></th>
                      <th scope="col"><div className="text-center text-nowrap">My APR</div></th>
                      <th scope="col"><div className="text-center text-nowrap">Expiry date</div></th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.context.account
                        ? 
                          <>
                          <tr>
                            <td className="d-none d-md-table-cell px-3">
                              <img src="https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0xba100000625a3754423978a60c9317c58a424e3D/logo.png" className="me-1" style={logoSize} alt="Asset icon" />
                              <img src="https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png" className="me-1" style={logoSize} alt="Asset icon" />
                            </td>
                            <td>
                              <div className="d-inline-flex align-items-center bg-light bg-opacity-10 text-nowrap px-2 py-1 me-2 rounded"><div className="me-1">BAL</div><div className="text-light text-opacity-75" style={{fontSize: '70%'}}>80%</div></div>
                              <div className="d-inline-flex align-items-center bg-light bg-opacity-10 text-nowrap px-2 py-1 me-2 rounded"><div className="me-1">WETH</div><div className="text-light text-opacity-75" style={{fontSize: '70%'}}>20%</div></div>
                            </td>
                            <td>$2540</td>
                            <td className="text-center text-nowrap">5.83% - 472.58% <i className="bi bi-stars text-primary" style={{fontSize: '90%'}}></i></td>
                            <td className="text-center text-nowrap">27 Jul 2023</td>
                          </tr>
                          </>
                        : <tr><td className="text-center p-3 fs-5 text-white text-opacity-50" colSpan="5">Connect your wallet</td></tr>
                    }
                  </tbody>
                </table>
              </div>
          </div>{/* veBAL Liquidity */}
      </> 
    );
  }
}

export default Portfolio;