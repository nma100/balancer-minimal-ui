import React from 'react';
import CryptoIcon from './CryptoIcon';
import { isDark } from '../theme';
import { OutletContext } from '../pages/Layout';
import { hideModal } from '../utils/page';

export const SELECT_TOKEN_MODAL = 'token-selector';

export class TokenSelector extends React.Component {

  static contextType = OutletContext;

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() { 
    const modal = document.getElementById(SELECT_TOKEN_MODAL);
    modal.addEventListener('show.bs.modal', this.onShow.bind(this));
    modal.addEventListener('shown.bs.modal', this.onShown.bind(this));
    modal.addEventListener('hide.bs.modal', this.onHide.bind(this));
  }
  
  handleSearch(e) {
    const match = (a, b) => a?.toUpperCase().includes(b?.toUpperCase());
    const found = this.state.allTokens.filter(t => 
      match(t.name, e.target.value) || 
      match(t.symbol, e.target.value));
    this.setState({ displayedTokens: found });
  }

  handleSelectToken(index) {
    const token = this.state.displayedTokens[index];
    this.props.onTokenSelect(token);
    hideModal(SELECT_TOKEN_MODAL);
  }

  async onShow() {
    const { balancer } = this.context;
    const tokens = await balancer.fetchTokens();
    this.setState({ allTokens: tokens, displayedTokens: tokens });
  }

  onShown() {
    document.getElementById('search-input').focus();
  }

  onHide() {
    this.setState({ allTokens: undefined, displayedTokens: undefined });
    document.getElementById('search-input').value = '';
  }

  css() {
    const { theme } = this.context;
    const contentClass = isDark(theme) ? 'bg-dark text-light' : 'bg-white  text-dark';
    const mutedClass = isDark(theme) ? 'text-light text-opacity-50' : 'text-muted';
    return { contentClass, mutedClass };
  }

  render() {
    const { contentClass, mutedClass } = this.css();

    return ( 
      <div id={SELECT_TOKEN_MODAL} className="modal" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
              <div className={`modal-content ${contentClass}`}>
                  <div className="modal-body">
                    <form>
                      <div className="mb-3">
                        <label htmlFor="search-input" className="col-form-label fs-4 py-0 mb-3">Select a token</label>
                        <input type="text" id="search-input" className="form-control" onChange={e => this.handleSearch(e)} placeholder="Search ..." autoComplete="off" />
                      </div>
                      <hr className="my-4" />
                      <div id="token-list">                     
                      {this.state.displayedTokens === undefined &&
                        <div className={`fs-4 text-center ${mutedClass}`}>Loading
                          <div className="spinner-border spinner ms-3" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      }
                      {this.state.displayedTokens?.length === 0 &&
                        <div className={`fs-4 text-center ${mutedClass}`}>No result</div>
                      }
                      {this.state.displayedTokens?.map((token, index) =>
                        <div key={index} className="token py-1" onClick={() => this.handleSelectToken(index)}>
                          <CryptoIcon key={token.symbol} name={token.symbol} cssClass="me-2" /> {token.symbol} <span className="text-muted ms-1">{token.name}</span>
                        </div>
                      )}
                      </div>
                    </form>
                  </div>
              </div>
          </div>
      </div>
    );
  }
}
