import React from "react";
import { OutletContext } from "../Layout";
import { isEthNetwork } from "../../networks";
import PoolTokens from "../../components/PoolTokens";
import PoolApr from "../../components/PoolApr";
import PoolBoost from "../../components/PoolBoost";
import PoolShares from "../../components/PoolShares";
import { bnum } from "../../utils/bnum"
import { dollar } from "../../utils/page";
import { format } from "date-fns";
import { Modal } from 'bootstrap';
import { StakingModal, STAKING_MODAL } from "./StakingModal";
import PoolIcons from "../../components/PoolIcons";
import { Theme } from "../../theme";

const LOCKDATE_FORMAT = 'd MMM yyyy';

class Portfolio extends React.Component {

  static contextType = OutletContext;

  constructor(props) {
    super(props);
    this.state = {};
  }

  handleStake(pool) {
    const modal = document.getElementById(STAKING_MODAL);
    modal.dataset.poolName = pool.name;
    modal.dataset.poolAddress = pool.address;
    modal.dataset.poolBpt = pool.bpt;
    modal.dataset.poolShares = pool.shares;
    Modal.getOrCreateInstance(`#${STAKING_MODAL}`).show();
  }

  css() {
    const isDark = (this.context.theme === Theme.Dark);

    const heroClass = isDark ? 'bg-dark bg-gradient' : 'bg-white bg-opacity-75 bg-gradient';
    const textClass = isDark ? 'text-light text-opacity-75' : 'text-dark text-opacity-75';
    const veBalClass = isDark ? 'veBAL' : 'veBAL-light';
    const tableClass = isDark ? 'table table-dark' : 'table bg-white bg-opacity-75';
    const btnClass = isDark ? 'btn btn-outline-light' : 'btn btn-light shadow-sm';

    return { heroClass, textClass, veBalClass, tableClass, btnClass };
  }

  render() {

    const {
      balancer, account, chainId, portfolio, stakedPools, 
      unstakedPools, veBalPool, stakedAmount, unstakedAmount, veBalAmount
    } = this.context;

    const { 
      heroClass, textClass, veBalClass, tableClass, btnClass 
    } = this.css();
    
    const isEthereum = () => account && isEthNetwork(chainId);
    
    let totalAmount;
    if (stakedAmount === undefined || 
        unstakedAmount === undefined || 
        (isEthereum() && veBalAmount === undefined)) {
      totalAmount = undefined;
    } else if (stakedAmount === false || 
        unstakedAmount === false || 
        (isEthereum() && veBalAmount === false)) {
      totalAmount = false;
    } else {
      totalAmount = bnum(stakedAmount).plus(unstakedAmount).plus(veBalAmount);
    }

    return (
      <>
        <StakingModal />
        <div id="invest-info" className={`${heroClass} text-center rounded shadow py-2 mb-5`}>
          <div className="title fs-1">My Balancer investments</div>
          {portfolio &&
            <div className="total d-flex justify-content-evenly flex-wrap fs-4">
              <div className="px-2">
                <span className={`${textClass} me-2`}>Total :</span>
                {totalAmount === undefined
                  ? <span className="placeholder-glow"><span className="amount placeholder placeholder-lg"></span></span>
                  : <span className="fw-bold">{dollar(totalAmount)}</span>
                }
              </div>
              {isEthereum() &&
                <div className="px-2">
                  <span className={`${textClass} me-2`}>veBAL :</span>
                  {veBalAmount === undefined
                    ? <span className="placeholder-glow"><span className="amount placeholder placeholder-lg"></span></span>
                    : <span className={veBalClass}>{dollar(veBalAmount)}</span>
                  }
                </div>
              }
              <div className="d-none d-md-block px-2">
                <span className={`${textClass} me-2`}>Staked :</span>
                {stakedAmount === undefined
                  ? <span className="placeholder-glow"><span className="amount placeholder placeholder-lg"></span></span>
                  : <span className={textClass}>{dollar(stakedAmount)}</span>
                }
              </div>
              <div className=" d-none d-md-block px-2">
                <span className={`${textClass} me-2`}>Unstaked :</span>
                {unstakedAmount === undefined
                  ? <span className="placeholder-glow"><span className="amount placeholder placeholder-lg"></span></span>
                  : <span className={textClass}>{dollar(unstakedAmount)}</span>
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
                          <div className={`spinner ${textClass} spinner-border ms-3`} role="status">
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
                                  <PoolIcons pool={pool} />
                                </td>
                                <td><PoolTokens pool={pool} /></td>
                                <td><PoolShares pool={pool} /></td>
                                <td className="text-end text-nowrap">
                                  <PoolApr pool={pool} />
                                </td>
                                <td className="text-center">
                                  {balancer.stakablePoolIds().includes(pool.id) ?
                                    <button type="button" className={`${btnClass} btn-sm`} onClick={() => this.handleStake(pool)}>Stake</button>
                                    : <>—</> 
                                  }
                                </td>
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
                          <div className={`spinner ${textClass} spinner-border ms-3`} role="status" >
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
                                  <PoolIcons pool={pool} />
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
                      <PoolIcons pool={veBalPool} />
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