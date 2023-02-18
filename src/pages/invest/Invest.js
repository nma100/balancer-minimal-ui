import React from 'react';
import PoolApr from '../../components/PoolApr';
import PoolIconsFlex from '../../components/PoolIconsFlex';
import PoolTokensFlex from '../../components/PoolTokensFlex';
import { OutletContext } from '../Layout';

class Invest extends React.Component {

  static contextType = OutletContext;

  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { pools } = this.context;
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
            {pools?.map(pool =>
              <tr key={pool.id}>
                <td className="d-none d-md-table-cell ">
                  <PoolIconsFlex pool={pool} />
                </td>
                <td><PoolTokensFlex pool={pool} /></td>
                <td className="d-none d-md-table-cell text-center">$245,79M</td>
                <td className="d-none d-md-table-cell text-center">$34,23M</td>
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
            </tbody>
          </table>
        </div>

      </>
    );
  }
}

export default Invest;