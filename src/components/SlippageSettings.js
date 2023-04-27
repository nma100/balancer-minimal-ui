import React from 'react';
import { isDark } from '../theme';
import { hideModal } from '../utils/page';
import { OutletContext } from '../pages/Layout';

export const SLIPPAGE_MODAL = 'slippage-settings';

export class SlippageSettings extends React.Component {
      
  static contextType = OutletContext;

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() { 
    const modal = document.getElementById(SLIPPAGE_MODAL);
    modal.addEventListener('show.bs.modal', this.onShow.bind(this));
  }
  
  async onShow() {
    const { maxSlippage } = this.props.settingsInfo;
    document.getElementById('max-slippage').value = maxSlippage;
  }

  async handleSave() {
    const value = document.getElementById('max-slippage').value; 
    const maxSlippage = Number(value);
    if (0 < maxSlippage && maxSlippage <= 10000) {
      this.props.settingsInfo.onSave({ maxSlippage });
    }
    hideModal(SLIPPAGE_MODAL);
  }

  css() {
    const { theme } = this.context;
    const contentClass = isDark(theme) ? 'bg-dark text-light' : 'bg-white text-dark';
    const btnClass = isDark(theme) ? 'btn btn-secondary' : 'btn btn-light border shadow-sm';
    return { contentClass, btnClass };
  }

  render() {
    const { contentClass, btnClass } = this.css();
    return ( 
      <div id={SLIPPAGE_MODAL} className="modal" tabIndex="-1">
          <div className="modal-dialog modal-sm modal-dialog-centered">
              <div className={`modal-content ${contentClass}`}>
                  <div className="modal-body">
                      <h3 className="mb-4">Settings</h3>
                      <div className="mb-4">
                        <label htmlFor="max-slippage" className="form-label">Max. slippage (in bps)</label>
                        <input type="number" min="1" step="1" autoComplete="off" className="form-control mb-1" id="max-slippage" />
                        <div className="small text-muted">1 bps = 0.01%</div>
                      </div>
                      <div className="container-fluid p-0">
                        <div className="row gx-2 gy-0">
                          <div className="col d-grid">
                            <button type="button" className={btnClass} onClick={() => this.handleSave()}>Save</button>
                          </div>
                          <div className="col d-grid">
                            <button type="button" className={btnClass} data-bs-dismiss="modal">Cancel</button>
                          </div>
                        </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    );
  }
}
