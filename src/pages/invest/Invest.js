import React from 'react';
import PoolApr from '../../components/PoolApr';
import PoolIconsFlex from '../../components/PoolIconsFlex';
import PoolTokensFlex from '../../components/PoolTokensFlex';
import PoolTvl from '../../components/PoolTvl';
import PoolVolume from '../../components/PoolVolume';
import { SELECT_TOKEN_MODAL, TokenSelector } from '../../components/TokenSelector';
import { Theme } from '../../theme';
import { openModal } from '../../utils/page';
import { OutletContext, POOLS_PER_PAGE } from '../Layout';

const Mode = { Init: 0, Search: 1, Display : 2 }

class Invest extends React.Component {

  static contextType = OutletContext;

  constructor(props) {
    super(props);
    this.state = { page: 0 };
  }

  async loadMore() {
    const { balancer, pools: contextPools } = this.context;
    let { page, pools: statePools } = this.state;
    this.setState({ loading: true });
    const more = await balancer.fetchPools(POOLS_PER_PAGE, ++page * POOLS_PER_PAGE);
    const pools = (statePools || contextPools).concat(more);
    this.setState({ loading: false, pools, page });
  }

  async searchPools(token) {
    this.setState({ poolSearch: token , pools: undefined });
    const pools = await this.context.balancer.findPoolsByToken(token.address);
    this.setState({ pools });
  }

  resetSearch() {
    this.setState({  poolSearch: undefined, pools: undefined, page: 0 });
  }

  mode() {
    const { pools: contextPools } = this.context;
    const { pools: statePools, poolSearch } = this.state;
    let mode;
    if (statePools === undefined && contextPools === undefined) {
      mode = Mode.Init;
    } else if (statePools === undefined && poolSearch !== undefined) {
      mode = Mode.Search;
    } else {
      mode = Mode.Display;
    }
    return mode;
  }

  css() {
    const isDark = (this.context.theme === Theme.Dark);
    const textClass  = isDark ? 'text-light' : 'text-dark';
    return { textClass };
  }

  render() {
    const { textClass } = this.css();
    const { pools: contextPools } = this.context;
    const { pools: statePools, poolSearch } = this.state;
    const mode = this.mode();
    return (
      <>
        <TokenSelector onTokenSelect={this.searchPools.bind(this)} />
        <div className="d-flex justify-content-between align-items-center bg-dark rounded shadow p-4 mb-4">
          <div className="fs-2">Deposit assets and earn yield</div>
          <div className="d-flex">
            {poolSearch !== undefined &&
              <div className="d-inline-flex align-items-center bg-light bg-opacity-10 text-nowrap px-2 py-1 rounded me-3">
                <div className="me-2">{poolSearch.symbol}</div>
                <div className="reset-search text-light text-opacity-75" onClick={() => this.resetSearch()}><i className="bi bi-x-square"></i></div>
              </div>
            }
            <button type="button" className="btn btn-outline-light" onClick={() => openModal(SELECT_TOKEN_MODAL)}>
              Search pool <i className="bi bi-search ms-1"></i>
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table id="pools" className="table table-dark align-middle m-0">
            <thead>
              <tr>
                <th scope="col" className="d-none d-md-table-cell"></th>
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
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
            }
            {mode === Mode.Display &&
              <>
                {(statePools || contextPools).map(pool =>
                  <tr key={pool.id}>
                    <td className="d-none d-md-table-cell ">
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
                      <div className="d-flex">
                        <button type="button" className="btn btn-outline-light me-1">Deposit</button>
                        <button type="button" className="btn btn-outline-light ms-1" disabled="">Withdraw</button>
                      </div>
                    </td>
                  </tr>
                )}
                {poolSearch === undefined &&
                  <tr>
                    <td className="text-center py-2" colSpan="6">
                      {this.state.loading ? (
                        <button type="button" className="btn btn-link btn-lg link-light text-decoration-none">
                          Loading ...
                        </button>
                      ) : (
                        <button type="button" className="btn btn-link btn-lg link-light text-decoration-none" onClick={() => this.loadMore()}>
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