import React from 'react';
import CryptoIcon from '../../components/CryptoIcon';
import { Modal } from 'bootstrap';
import { SELECT_TOKEN_MODAL, TokenSelector } from './TokenSelector';
import { OutletContext } from '../Layout';

const TOKEN_IN = 'in', TOKEN_OUT = 'out';

class Trade extends React.Component {

  static contextType = OutletContext;

  constructor(props) {
    super(props);
    this.state = {};
  }

  openTokenSelector(type) {
    this.setState({tokenSelectType: type});
    Modal.getOrCreateInstance(`#${SELECT_TOKEN_MODAL}`).show();
  }

  onTokenSelect(token) {
    const type = this.state.tokenSelectType;
    console.log('onTokenSelect', type, token);
  }

  render() {
    return (
      <>
        <TokenSelector onTokenSelect={this.onTokenSelect.bind(this)} />
        <div className="row">
          <div className="col-12 col-lg-8 col-xxl-6">
            <div className="bg-dark bg-gradient rounded shadow p-3 pt-2">
              <div className="pb-4 d-flex justify-content-between align-items-center">
                <div className="fs-1">Swap tokens</div>
                <div className="text-light text-opacity-50 pt-2 pt-lg-3 pe-2">1 ETH = 456 BAL</div>
              </div>
              <div className="d-flex justify-content-between align-items-center bg-light bg-opacity-10 rounded px-4 py-2">
                <div>
                  <div className="fs-1 mb-1">12</div>
                  <div className="text-light text-opacity-75">$50000.00</div>
                </div>
                <div>
                  <div className="select-token d-flex bg-light bg-opacity-10 rounded-5 shadow px-3 py-2 mb-2" onClick={() => this.openTokenSelector(TOKEN_IN)}>
                    <CryptoIcon name="ETH" cssClass="me-3" /> <span className="fs-5 me-3">ETH</span> <i className="bi bi-chevron-down align-self-center"></i>
                  </div>
                  <div className="text-center small">Balance : 15 <span className="px-1">·</span> <a href="/" className="link-light">Max</a></div>
                </div>
              </div>
              <div className="swap-separator position-relative">
                <div className="progress">
                  <div className="progress-bar" role="progressbar" aria-label="Progress" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <div className="arrow position-absolute top-0 start-50 translate-middle bg-secondary rounded-5 d-none d-sm-flex justify-content-center align-items-center">
                  <i className="bi bi-arrow-down"></i>
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center bg-light bg-opacity-10 rounded px-4 py-2 mb-3">
                <div>
                  <div className="fs-1 mb-1">500</div>
                  <div className="text-light text-opacity-75">$50001.34</div>
                </div>
                <div>
                  <div className="select-token d-flex bg-light bg-opacity-10 rounded-5 shadow px-3 py-2 mb-2" onClick={() => this.openTokenSelector(TOKEN_OUT)}>
                    <CryptoIcon name="BAL" cssClass="me-3" /> <span className="fs-5 me-3">BAL</span> <i className="bi bi-chevron-down align-self-center"></i>
                  </div>
                  <div className="text-center small">Balance : 800</div>
                </div>
              </div>
              <div className="d-grid">
                <button className="btn btn-secondary btn-lg fs-4" type="button">Swap</button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default Trade;