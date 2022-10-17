import React from "react";
import { OutletContext } from "./Layout";
import { isEthNetwork } from "../networks";
import { CryptoIcon } from "../components/CryptoIcon";
import { bnumToStr } from "../utils/bnum"

class Portfolio extends React.Component {

  static contextType = OutletContext;

  constructor(props) {
    console.log("constructor", props);
    super(props);
    this.state = {};
  }

  async componentDidMount() {
    console.log("componentDidMount", this.state);
  }

  async componentDidUpdate() {
    console.log("componentDidUpdate", this.state);
  }

  isEthereum() {
    return this.context.account && isEthNetwork(this.context.chainId);
  }

  render() {
    console.log("render", this.context);
    const { account, portfolio } = this.context;
    const LOGO_SIZE = { width: "1.2rem", height: "1.2rem" };
    return (
      <>
          <div id="invest-info" className="bg-dark bg-gradient text-center rounded shadow py-2 mb-5">
            <div className="title fs-1">My Balancer investments</div>
            <div className="total fs-2 text-light text-opacity-75 fw-bold">
              { bnumToStr(portfolio?.totalInvest) }
            </div> 
            { this.isEthereum() && <div className="veBAL fs-3">---- in veBAL</div> }
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
                    {account ? 
                          <>
                          {portfolio?.unstakedPools.pools.map(pool =>
                            <tr key={pool.id}>
                              <td className="d-none d-md-table-cell px-3">
                                {pool.tokens.map(token =>
                                  <span key={token.id} className="me-1"><CryptoIcon name={token.symbol} /></span>
                                )}
                              </td>
                              <td>
                                {pool.tokens.map(token =>
                                  <div key={token.id} className="d-inline-flex align-items-center bg-light bg-opacity-10 text-nowrap px-2 py-1 me-1 rounded"><div className="me-1">{token.symbol}</div><div className="text-light text-opacity-75" style={{fontSize: '70%'}}>{token.weight?.substring(0,4)}%</div></div>
                                )}
                              </td>
                              <td>${bnumToStr(pool.shares)}</td>
                              <td className="text-end text-nowrap">---</td>
                              <td className="text-center">---</td>
                            </tr>
                          )}
                          {/*
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
                          */}
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
                    {account ? 
                          <>
                          {portfolio?.stakedPools.pools.map(pool =>
                            <tr key={pool.id}>
                              <td className="d-none d-md-table-cell px-3">
                                {pool.tokens.map(token =>
                                  <span key={token.id} className="me-1"><CryptoIcon name={token.symbol} /></span>   
                                )}
                              </td>
                              <td>
                                {pool.tokens.map(token =>
                                  <div key={token.id} className="d-inline-flex align-items-center bg-light bg-opacity-10 text-nowrap px-2 py-1 me-1 rounded"><div className="me-1">{token.symbol}</div><div className="text-light text-opacity-75" style={{fontSize: '70%'}}>{token.weight?.substring(0,4)}%</div></div>
                                )}
                              </td>
                              <td>${bnumToStr(pool.shares)}</td>
                              <td className="text-center text-nowrap">---</td>
                              <td className="text-center text-nowrap">---</td>
                            </tr>
                          )}
                          {/*
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
                          */}
                          </>
                        : <tr><td className="text-center p-3 fs-5 text-white text-opacity-50" colSpan="5">Connect your wallet</td></tr>
                    }
                </tbody>
              </table>
            </div>
          </div>{/* Staked pools */}

          { this.isEthereum() && 
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
                      <tr>
                        <td className="d-none d-md-table-cell px-3">
                          <img src="https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0xba100000625a3754423978a60c9317c58a424e3D/logo.png" className="me-1" style={LOGO_SIZE} alt="Asset icon" />
                          <img src="https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png" className="me-1" style={LOGO_SIZE} alt="Asset icon" />
                        </td>
                        <td>
                          <div className="d-inline-flex align-items-center bg-light bg-opacity-10 text-nowrap px-2 py-1 me-2 rounded"><div className="me-1">BAL</div><div className="text-light text-opacity-75" style={{fontSize: '70%'}}>80%</div></div>
                          <div className="d-inline-flex align-items-center bg-light bg-opacity-10 text-nowrap px-2 py-1 me-2 rounded"><div className="me-1">WETH</div><div className="text-light text-opacity-75" style={{fontSize: '70%'}}>20%</div></div>
                        </td>
                        <td>$2540</td>
                        <td className="text-center text-nowrap">5.83% - 472.58% <i className="bi bi-stars text-primary" style={{fontSize: '90%'}}></i></td>
                        <td className="text-center text-nowrap">27 Jul 2023</td>
                      </tr>
                  </tbody>
                </table>
              </div>
          </div>
          }
      </> 
    );
  }
}

export default Portfolio;