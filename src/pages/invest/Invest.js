import React from 'react';
import PoolApr from '../../components/PoolApr';
import PoolIconsFlex from '../../components/PoolIconsFlex';
import PoolTokensFlex from '../../components/PoolTokensFlex';
import PoolTvl from '../../components/PoolTvl';
import PoolVolume from '../../components/PoolVolume';
import { Theme } from '../../theme';
import { OutletContext, POOLS_PER_PAGE } from '../Layout';

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

  
  css() {
    const isDark = (this.context.theme === Theme.Dark);
    const textClass  = isDark ? 'text-light' : 'text-dark';
    return { textClass };
  }

  render() {
    const { textClass } = this.css();
    const { pools: contextPools } = this.context;
    const { pools: statePools } = this.state;
    const pools = statePools || contextPools;

    return (
      <>
        <div className="d-flex justify-content-between align-items-center bg-dark rounded shadow p-4 mb-4">
          <div className="fs-2">Deposit assets and earn yield</div>
          <div>
            <div className="input-group">
              <input type="text" className="form-control" placeholder="Search pool" aria-label="Search pool" aria-describedby="Search pool" />
              <button className="btn btn-outline-light" type="button" id="button-search"><i className="bi bi-search"></i></button>
            </div>            
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
            {pools === undefined ? (
                <tr>
                  <td className={`${textClass}  text-opacity-75 text-center p-3 fs-4`} colSpan="6">Loading pools
                    <div className={`spinner ${textClass} text-opacity-75 spinner-border ms-3`} role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {pools.map(pool =>
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
                </>
              )}
            </tbody>
          </table>
        </div>

      </>
    );
  }
}

export default Invest;