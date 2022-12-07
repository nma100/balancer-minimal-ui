import React from 'react';
import CryptoIcon from '../../components/CryptoIcon';
import { TokenListService } from '../../protocol/services/token-list-service';
import { isDark } from '../../theme';
import { OutletContext } from '../Layout';
import { Modal } from 'bootstrap';

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
    Modal.getInstance(`#${SELECT_TOKEN_MODAL}`).hide();
  }

  onShow() {
    new TokenListService(this.context.chainId)
      .approvedTokens()
      .then(approved => { 
        const tokens = approved.reduce((accu, current) => accu.concat(current.tokens), []);
        this.setState({ allTokens: tokens, displayedTokens: tokens });
    });
  }

  onHide() {
    document.getElementById('search-input').value = '';
    this.setState({ allTokens: undefined, displayedTokens: undefined });
  }

  css() {
    const { theme } = this.context;
    const contentClass = isDark(theme) ? 'bg-dark text-light' : 'bg-light text-dark';
    return { contentClass };
  }

  render() {
    const { contentClass } = this.css();

    return ( 
      <div id={SELECT_TOKEN_MODAL} className="modal" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
              <div className={`modal-content ${contentClass}`}>
                  <div className="modal-body">
                    <form>
                      <div className="mb-3">
                        <label htmlFor="search-input" className="col-form-label fs-4 py-0 mb-3">Select a token</label>
                        <input type="text" id="search-input" className="form-control" onChange={e => this.handleSearch(e)} placeholder="Search name" />
                      </div>
                      <hr />
                      <div>
                      {this.state.displayedTokens === undefined &&
                        <div className="fs-4 text-muted text-center">Loading ...</div>
                      }
                      {this.state.displayedTokens?.length === 0 &&
                        <div className="fs-4 text-muted text-center">No result</div>
                      }
                      {this.state.displayedTokens?.map((token, index) =>
                        <div key={index} className="select-token py-1" onClick={() => this.handleSelectToken(index)}>
                          <CryptoIcon key={token.symbol} name={token.symbol} cssClass="me-2" /> {token.symbol} <span className="text-muted">{token.name}</span>
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
