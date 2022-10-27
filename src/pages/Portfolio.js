import React, { Suspense } from "react";
import { OutletContext } from "./Layout";
import { isEthNetwork } from "../networks";
import CryptoIcon from "../components/CryptoIcon";

import { bnum, bnumToStr } from "../utils/bnum"
import { format } from "date-fns";
import PoolTokens from "../components/PoolTokens";

const SPINNER_SIZE = { width: '2rem', height: '2rem' };

const PoolApr = React.lazy(() => import("../components/PoolApr"));
const PoolBoost = React.lazy(() => import("../components/PoolBoost"));

class Portfolio extends React.Component {

  static contextType = OutletContext;

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps, prevState) {
  }

  render() {

    const isEthereum = () => account && isEthNetwork(chainId);

    const {
      account, chainId, portfolio, stakedPools, unstakedPools,
      veBalPool, stakedAmount, unstakedAmount, veBalAmount
    } = this.context;

    const totalAmount = bnum(stakedAmount).plus(unstakedAmount).plus(veBalAmount);

    return (
      <>
        <div id="invest-info" className="bg-dark bg-gradient text-center rounded shadow py-2 mb-5">
          <div className="title fs-1 py-2">My Balancer investments</div>
          {portfolio &&
            <div className="total fs-4">
              <span className="me-5"><span className="text-light text-opacity-75">Total :</span> ${bnumToStr(totalAmount)}</span>
              {isEthereum() &&
                <span className="me-5"><span className="text-light text-opacity-75">veBAL :</span> ${bnumToStr(veBalAmount)}</span>
              }
              <span className="me-5"><span className="text-light text-opacity-75">Staked :</span> ${bnumToStr(stakedAmount)}</span>
              <span><span className="text-light text-opacity-75">Unstaked :</span> ${bnumToStr(unstakedAmount)}</span>
            </div>
          }
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
                {portfolio ?
                  <>
                    {unstakedPools === undefined ?
                      <tr>
                        <td className="text-center p-3 fs-4 text-white text-opacity-75" colSpan="5">Loading data
                          <div className="spinner-border text-white text-opacity-75 ms-2" role="status" style={SPINNER_SIZE} >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                      :
                      <>
                        {unstakedPools.length === 0 ?
                          <tr><td className="text-center p-3 fs-5 text-white text-opacity-50" colSpan="5">You have no unstaked investments</td></tr>
                          :
                          <>
                            {unstakedPools.map(pool =>
                              <tr key={pool.id}>
                                <td className="d-none d-md-table-cell px-3">
                                  {pool.tokens.map(token =>
                                    <span key={token.id} className="me-1"><CryptoIcon name={token.symbol} /></span>
                                  )}
                                </td>
                                <td><PoolTokens pool={pool} /></td>
                                <td>${bnumToStr(pool.shares)}</td>
                                <td className="text-end text-nowrap">
                                  <Suspense>
                                    <PoolApr pool={pool} context={this.context} />
                                  </Suspense>
                                </td>
                                <td className="text-center">—</td>
                              </tr>
                            )}
                          </>
                        }
                      </>
                    }
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
                  {isEthereum() &&
                    <th scope="col"><div className="text-center text-nowrap">My boost</div></th>
                  }
                  <th scope="col"><div className="text-center text-nowrap">My APR</div></th>
                </tr>
              </thead>
              <tbody>
                {portfolio ?
                  <>
                    {unstakedPools === undefined ?
                      <tr>
                        <td className="text-center p-3 fs-4 text-white text-opacity-75" colSpan="5">Loading data
                          <div className="spinner-border text-white text-opacity-75 ms-2" role="status" style={SPINNER_SIZE} >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                      : <>
                        {stakedPools.length === 0 ?
                          <><tr><td className="text-center p-3 fs-5 text-white text-opacity-50" colSpan="5">You have no staked investments</td></tr></>
                          :
                          <>
                            {stakedPools.map(pool =>
                              <tr key={pool.id}>
                                <td className="d-none d-md-table-cell px-3">
                                  {pool.tokens.map(token =>
                                    <span key={token.id} className="me-1"><CryptoIcon name={token.symbol} /></span>
                                  )}
                                </td>
                                <td><PoolTokens pool={pool} /></td>
                                <td>${bnumToStr(pool.shares)}</td>
                                {isEthereum() &&
                                  <td className="text-center text-nowrap">
                                    <Suspense>
                                      <PoolBoost pool={pool} context={this.context} />
                                    </Suspense>
                                  </td>
                                }
                                <td className="text-center">
                                  <Suspense>
                                    <PoolApr pool={pool} context={this.context} />
                                  </Suspense>
                                </td>
                              </tr>
                            )}</>
                        }
                      </>
                    }
                  </>
                  : <tr><td className="text-center p-3 fs-5 text-white text-opacity-50" colSpan="5">Connect your wallet</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>{/* Staked pools */}

        {isEthereum() && veBalPool?.shares.isGreaterThan(0) &&
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
                      {veBalPool.tokens.map(token =>
                        <span key={token.id} className="me-1"><CryptoIcon name={token.symbol} /></span>
                      )}
                    </td>
                    <td><PoolTokens pool={veBalPool} /></td>
                    <td>${bnumToStr(veBalPool.shares)}</td>
                    <td className="text-center text-nowrap">
                      <Suspense>
                        <PoolApr pool={veBalPool} context={this.context} />
                      </Suspense>
                    </td>
                    <td className="text-center text-nowrap">
                      {veBalPool.lockedEndDate ? format(veBalPool.lockedEndDate, 'd MMM yyyy') : '—'}
                    </td>
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