import React from 'react';
import { isDark } from '../theme';
import { GOERLI_ID, NETWORKS } from '../networks';
import { hideModal } from '../utils/page';

export const SELECT_NETWORK_MODAL = 'select-network-modal';

export class NetworkSelector extends React.Component {
      
  constructor(props) {
    super(props);
    this.state = {};
  }

  handleSelect(chainId) {
    hideModal(SELECT_NETWORK_MODAL);
    this.props.onNetworkSelect(chainId);
  }

  css() {
    const { theme } = this.props;
    const contentClass = isDark(theme) ? 'bg-dark text-light' : 'bg-white text-dark';
    const btnClass = isDark(theme) ? 'btn btn-outline-light btn-lg' : 'btn btn-light btn-lg border shadow-sm';
    const btnCloseClass = isDark(theme) ? 'btn-close-white' : '';
    return { contentClass, btnClass, btnCloseClass };
  }

  render() {
    const { contentClass, btnClass, btnCloseClass } = this.css();
    return ( 
      <div id={SELECT_NETWORK_MODAL} className="modal" tabIndex="-1">
          <div className="modal-dialog modal-sm modal-dialog-centered">
              <div className={`modal-content ${contentClass}`}>
                  <div className="modal-body">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h3>Select network</h3> 
                        <button type="button" className={`btn-close ${btnCloseClass}`} data-bs-dismiss="modal" aria-label="Close"></button>
                      </div>
                      <div className="d-grid gap-2">
                        {Object.keys(NETWORKS).map((chainId) => (
                          <button type="button" key={chainId} className={btnClass} onClick={() => this.handleSelect(chainId)}>
                            <div className="d-flex align-items-center">
                              <img className="icon" src={`/image/network/${NETWORKS[chainId].name}.svg`} alt="network"/> 
                              <div className="ps-2">{NETWORKS[chainId].name}</div>
                              {(chainId === GOERLI_ID) &&
                                <div className="ms-auto fs-6 text-warning">(Testnet)</div>
                              }
                            </div>
                          </button>
                        ))}
                      </div>
                  </div>
              </div>
          </div>
      </div>
    );
  }
}
