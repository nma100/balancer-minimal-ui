import React from "react";
import { OutletContext } from "./Layout";
import { isEthNetwork } from "../networks";
import CryptoIcon from "../components/CryptoIcon";
import PoolTokens from "../components/PoolTokens";
import PoolApr from "../components/PoolApr";
import PoolBoost from "../components/PoolBoost";
import PoolShares from "../components/PoolShares";
import { bnum, bnumf } from "../utils/bnum"
import { format } from "date-fns";

const LOCKDATE_FORMAT = 'd MMM yyyy';
const UNAVAILABLE = 'N/A';

const SPINNER_SIZE = { width: '1.5rem', height: '1.5rem' };
const AMOUNT_WIDTH = { width: '5rem' };

class Portfolio extends React.Component {

  static contextType = OutletContext;

  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {

    const {
      account, chainId, theme, portfolio, stakedPools, unstakedPools,
      veBalPool, stakedAmount, unstakedAmount, veBalAmount
    } = this.context;
    
    const isEthereum = () => account && isEthNetwork(chainId);
    const amount = (val) => val === false ? UNAVAILABLE : `$${bnumf(val)}`;
    
    let totalAmount;
    if (stakedAmount === undefined || 
        unstakedAmount === undefined || 
        (isEthereum()  && veBalAmount === undefined)) {
      totalAmount = undefined;
    } else if (stakedAmount === false || 
        unstakedAmount === false || 
        (isEthereum() && veBalAmount === false)) {
      totalAmount = false;
    } else {
      totalAmount = bnum(stakedAmount).plus(unstakedAmount).plus(veBalAmount);
    }


    const isDark = (theme === 'dark');

    const heroClass = isDark ? 'bg-dark bg-gradient' : 'bg-white bg-opacity-75 bg-gradient';
    const textClass = isDark ? 'text-light text-opacity-75' : 'text-dark text-opacity-75';
    const veBalClass = isDark ? 'veBAL' : 'veBAL-light';
    const tableClass = isDark ? 'table table-dark' : 'table bg-white bg-opacity-75';

    return (
      <>
        <div id="invest-info" className={`${heroClass} text-center rounded shadow py-2 mb-5`}>
          <div className="title fs-1">My Balancer investments</div>
          {portfolio &&
            <div className="total d-flex justify-content-evenly flex-wrap fs-4">
              <div className="px-2">
                <span className={`${textClass} me-2`}>Total :</span>
                {totalAmount === undefined
                  ? <span className="placeholder-glow"><span className="placeholder placeholder-lg" style={AMOUNT_WIDTH}></span></span>
                  : <span className="fw-bold">{amount(totalAmount)}</span>
                }
              </div>
              {isEthereum() &&
                <div className="px-2">
                  <span className={`${textClass} me-2`}>veBAL :</span>
                  {veBalAmount === undefined
                    ? <span className="placeholder-glow"><span className="placeholder placeholder-lg" style={AMOUNT_WIDTH}></span></span>
                    : <span className={veBalClass}>{amount(veBalAmount)}</span>
                  }
                </div>
              }
              <div className="px-2">
                <span className={`${textClass} me-2`}>Staked :</span>
                {stakedAmount === undefined
                  ? <span className="placeholder-glow"><span className="placeholder placeholder-lg" style={AMOUNT_WIDTH}></span></span>
                  : <span className={textClass}>{amount(stakedAmount)}</span>
                }
              </div>
              <div className="px-2">
                <span className={`${textClass} me-2`}>Unstaked :</span>
                {unstakedAmount === undefined
                  ? <span className="placeholder-glow"><span className="placeholder placeholder-lg" style={AMOUNT_WIDTH}></span></span>
                  : <span className={textClass}>{amount(unstakedAmount)}</span>
                }
              </div>
            </div>
          }
        </div>

        <h2 className="mb-4 pt-1 pt-xxl-2">My investments</h2>

        <div id="unstaked-pools" className="mb-5">
          <h4 className="mb-3">Unstaked pools</h4>
          <div className="table-responsive">
            <table className={`${tableClass} shadow-sm align-middle`}>
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
                        <td className={`${textClass} text-center p-3 fs-4`} colSpan="5">Loading data
                          <div className={`${textClass} spinner-border ms-3`} role="status" style={SPINNER_SIZE} >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                      :
                      <>
                        {unstakedPools.length === 0 ?
                          <tr><td className={`${textClass} text-center p-3 fs-5`}  colSpan="5">You have no unstaked investments</td></tr>
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
                                <td><PoolShares pool={pool} /></td>
                                <td className="text-end text-nowrap">
                                  <PoolApr pool={pool} />
                                </td>
                                <td className="text-center">—</td>
                              </tr>
                            )}
                          </>
                        }
                      </>
                    }
                  </>
                  : <tr><td className={`${textClass} text-center p-3 fs-5`} colSpan="5">Connect your wallet</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>{/* Unstaked pools */}

        <div id="staked-pools" className="mb-5">
          <h4 className="mb-3">Staked pools</h4>
          <div className="table-responsive">
            <table className={`${tableClass} shadow-sm align-middle`}>
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
                    {stakedPools === undefined ?
                      <tr>
                        <td className={`${textClass} text-center p-3 fs-4`} colSpan="5">Loading data
                          <div className={`${textClass} spinner-border ms-3`} role="status" style={SPINNER_SIZE} >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                      : <>
                        {stakedPools.length === 0 ?
                          <><tr><td className={`${textClass} text-center p-3 fs-5`} colSpan="5">You have no staked investments</td></tr></>
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
                                <td><PoolShares pool={pool} /></td>
                                {isEthereum() &&
                                  <td className="text-center text-nowrap">
                                      <PoolBoost pool={pool} />
                                  </td>
                                }
                                <td className="text-center">
                                  <PoolApr pool={pool} />
                                </td>
                              </tr>
                            )}</>
                        }
                      </>
                    }
                  </>
                  : <tr><td className={`${textClass} text-center p-3 fs-5`} colSpan="5">Connect your wallet</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>{/* Staked pools */}

        {isEthereum() && veBalPool?.shares.isGreaterThan(0) &&
          <div id="veBAL-liquidity">
            <h4 className="pool-title mb-3">veBAL protocol liquidity</h4>
            <div className="table-responsive">
              <table className={`${tableClass} shadow-sm align-middle`}>
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
                    <td><PoolShares pool={veBalPool} /></td>
                    <td className="text-center text-nowrap">
                      <PoolApr pool={veBalPool} />
                    </td>
                    <td className="text-center text-nowrap">
                      {veBalPool.lockedEndDate ? format(veBalPool.lockedEndDate, LOCKDATE_FORMAT) : '—'}
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