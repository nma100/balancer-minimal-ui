import React from 'react';
import { NavLink } from 'react-router-dom';
import PoolApr from '../../components/PoolApr';
import PoolIconsFlex from '../../components/PoolIconsFlex';
import PoolTokensFlex from '../../components/PoolTokensFlex';
import PoolTvl from '../../components/PoolTvl';
import PoolVolume from '../../components/PoolVolume';
import { SELECT_TOKEN_MODAL, TokenSelector } from '../../components/TokenSelector';
import { Theme } from '../../theme';
import { openModal } from '../../utils/page';
import { OutletContext, POOLS_PER_PAGE } from '../Layout';

const SESSION_POOL_LIST = 'pool-list';
const SESSION_POOL_SCROLL = 'pool-scroll';
const SESSION_POOL_SEARCH = 'pool-search';

const Mode = { Init: 0, Search: 1, Display : 2 }

class Invest extends React.Component {

  static contextType = OutletContext;

  constructor(props) {
    super(props);
    this.state = {};
    this.onScroll = this.onScroll.bind(this); 
  }

  componentDidMount() {
    document.addEventListener('scroll', this.onScroll);
    const scrollRestoration = this.getSession(SESSION_POOL_SCROLL) || 0;
    window.scroll({ top: scrollRestoration, left: 0, behavior: 'instant' });
  }

  componentWillUnmount() {
    document.removeEventListener('scroll', this.onScroll);
  }

  onScroll(e) {
    const { scrollTop } = e.target.documentElement;
    this.setSession(SESSION_POOL_SCROLL, scrollTop);
  };

  async loadMore() {
    const { balancer } = this.context;
    const { pools, page } = this.getPoolsData();
    this.setState({ loading: true });
    const more = await balancer.fetchPools(POOLS_PER_PAGE, page * POOLS_PER_PAGE);
    this.setPoolsData(pools.concat(more));
    this.setState({ loading: false });
  }

  async searchPools(token) {
    this.setState({ searching: true });
    const pools = await this.context.balancer.findPoolsByToken(token.address);
    this.setPoolsData(pools, token);
    this.setState({ searching: false });
  }

  getPoolsData() {
    const { pools: contextPools } = this.context;
    const sessionPools = this.getSession(SESSION_POOL_LIST);
    const poolSearch = this.getSession(SESSION_POOL_SEARCH);
    const pools = sessionPools || contextPools;
    const page = pools?.length / POOLS_PER_PAGE;
    return { pools, page, poolSearch };
  }

  setPoolsData(pools, poolSearch) {
    this.setSession(SESSION_POOL_LIST, pools);
    this.setSession(SESSION_POOL_SEARCH, poolSearch);
  }

  resetSearch() {
    this.setPoolsData(undefined, undefined);
    this.setState({ mode: Mode.Display });
  }

  mode() {
    const { searching } = this.state;
    const poolsData = this.getPoolsData();
    let mode;
    if (poolsData?.pools === undefined) {
      mode = Mode.Init;
    } else if (searching === true) {
      mode = Mode.Search;
    } else {
      mode = Mode.Display;
    }
    return mode;
  }
  
  getSession(key) {
    const { chainId } = this.context;
    const item = sessionStorage.getItem(chainId + key);
    return item ? JSON.parse(item) : undefined;
  }

  setSession(key, item) {
    const { chainId } = this.context;
    if (item) {
      sessionStorage.setItem(chainId + key, JSON.stringify(item));
    } else {
      sessionStorage.removeItem(chainId + key);
    }
  }

  css() {
    const isDark = (this.context.theme === Theme.Dark);
    const heroClass  = isDark ? 'bg-dark bg-gradient' : 'bg-white bg-opacity-75 bg-gradient';
    const textClass  = isDark ? 'text-light' : 'text-dark';
    const textSearchClass  = isDark ? 'text-light text-opacity-75' : 'text-dark';
    const btnClass = isDark ? 'btn btn-outline-light' : 'btn btn-light border shadow-sm';
    const linkClass = isDark ? 'link-light' : 'link-dark';
    const tableClass = isDark ? 'table table-dark' : 'table bg-white bg-opacity-75';
    return { textClass, textSearchClass, btnClass, heroClass, tableClass, linkClass };
  }

  render() {
    const { textClass, textSearchClass, btnClass, heroClass, tableClass, linkClass } = this.css();
    const poolsData = this.getPoolsData();
    const mode = this.mode();
    return (
      <>
        <TokenSelector onTokenSelect={this.searchPools.bind(this)} />
        <div className={`d-flex justify-content-between align-items-center flex-wrap rounded shadow p-4 mb-4 ${heroClass}`}>
          <div className="fs-2">Deposit assets and earn yield</div>
          <div className="d-flex py-3 py-sm-0">
            {poolsData?.poolSearch !== undefined &&
              <div className="d-inline-flex align-items-center bg-light bg-opacity-10 text-nowrap px-2 py-1 rounded me-3">
                <div className="me-2">{poolsData.poolSearch.symbol}</div>
                <div className={`reset-search ${textSearchClass}`} onClick={() => this.resetSearch()}><i className="bi bi-x-square"></i></div>
              </div>
            }
            <button type="button" className={btnClass} onClick={() => openModal(SELECT_TOKEN_MODAL)}>
              Search pool <i className="bi bi-search ms-1"></i>
            </button>
          </div>
        </div>
        <div className="table-responsive">
          <table id="pools" className={`${tableClass} shadow-sm align-middle m-0`}>
            <thead>
              <tr>
                <th scope="col" className="d-none d-lg-table-cell"></th>
                <th scope="col">Composition</th>
                <th scope="col" className="text-center d-none d-md-table-cell">TVL</th>
                <th scope="col" className="text-center text-nowrap d-none d-md-table-cell">Volume (24h)</th>
                <th scope="col" className="text-center">APR</th>
                <th scope="col" className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
            {mode === Mode.Init &&
                <tr>
                  <td className={`${textClass}  text-opacity-75 text-center p-3 fs-4`} colSpan="6">Loading pools
                    <div className={`spinner ${textClass} text-opacity-75 spinner-border ms-3`} role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
            }
            {mode === Mode.Search &&
                <tr>
                  <td className={`${textClass}  text-opacity-75 text-center p-3 fs-4`} colSpan="6">Searching
                    <div className={`spinner ${textClass} text-opacity-75 spinner-border ms-3`} role="status">
                      <span className="visually-hidden">Searching...</span>
                    </div>
                  </td>
                </tr>
            }
            {mode === Mode.Display &&
              <>
                {(poolsData?.pools || []).map(pool =>
                  <tr key={pool.id}>
                    <td className="d-none d-lg-table-cell ">
                      <PoolIconsFlex pool={pool} />
                    </td>
                    <td><PoolTokensFlex pool={pool} /></td>
                    <td className="d-none d-md-table-cell text-center">
                      <PoolTvl pool={pool} />
                    </td>
                    <td className="d-none d-md-table-cell text-center">
                      <PoolVolume pool={pool} />
                    </td>
                    <td className="text-center text-nowrap">
                      <PoolApr pool={pool} />
                    </td>
                    <td>
                      <div className="d-flex flex-wrap flex-sm-nowrap">
                        <NavLink className={`${btnClass} m-1`} to={`/join-pool/${pool.id}`} state={pool}>Deposit</NavLink>
                        <NavLink className={`${btnClass} m-1`} to={`/exit-pool/${pool.id}`} state={pool}>Withdraw</NavLink>
                      </div>
                    </td>
                  </tr>
                )}
                {poolsData?.poolSearch === undefined &&
                  <tr>
                    <td className="text-center py-2" colSpan="6">
                      {this.state.loading ? (
                        <button type="button" className={`btn btn-link btn-lg ${linkClass} text-decoration-none`}>
                          Loading ...
                        </button>
                      ) : (
                        <button type="button" className={`btn btn-link btn-lg ${linkClass} text-decoration-none`} onClick={() => this.loadMore()}>
                          <span className="me-1">Load more</span> <i className="bi bi-chevron-down"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                }
              </>
            }
            </tbody>
          </table>
        </div>

      </>
    );
  }
}

export default Invest;