import React from 'react';
import { isDark } from '../../theme';
import { hideModal, openToast } from '../../utils/page';
import { OutletContext } from '../Layout';

export const PREVIEW_MODAL = 'preview';
export const RESULT_TOAST  = 'result';

// TODO Reentrance

export class Preview extends React.Component {
      
  static contextType = OutletContext;

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() { 
    const modal = document.getElementById(PREVIEW_MODAL);
    modal.addEventListener('show.bs.modal', this.onShow.bind(this));
    modal.addEventListener('hide.bs.modal', this.onHide.bind(this));
    modal.addEventListener('hidden.bs.modal', this.onHidden.bind(this));
  }
  
  onShow() {
  }

  onHide() {
  }

  async onHidden() {
    const { tx } = this.state;

    if (tx !== undefined) {
      openToast(RESULT_TOAST);
      this.setState({ waiting: true });
      await tx.wait();
      this.setState({ waiting: false });
    }
  }
      
  async handleSwap() {
    const { balancer, web3Provider, account } = this.context;
    const { route, kind } = this.props.swapInfo;
    const signer = web3Provider.getSigner();

    const tx = await balancer.swap(route, kind, signer, account);
    this.setState({ tx }, () => hideModal(PREVIEW_MODAL));
  }

  css() {
    const { theme } = this.context;
    const contentClass = isDark(theme) ? 'bg-dark text-light' : 'bg-light text-dark';
    return { contentClass };
  }

  render() {
    const { contentClass } = this.css();
    return ( 
      <>
        <div id={PREVIEW_MODAL} className="modal" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
                <div className={`modal-content ${contentClass}`}>
                    <div className="modal-body">
                      <p>In : </p>
                      <p>Out : </p>
                      <p className="small">Price impact : </p>
                      <p className="small">Max Slippage : </p>
                      <button type="button" className="btn btn-secondary" onClick={() => this.handleSwap()}>Swap</button>
                    </div>
                </div>
            </div>
        </div>
        <div className="toast-container position-fixed bottom-0 end-0 p-3">
          <div id={RESULT_TOAST} className="toast" role="alert" aria-live="assertive" aria-atomic="true"  data-bs-autohide="false">
            <div className="toast-header">
              <strong className="me-auto">Swap</strong>
              <small>11 mins ago</small>
              <button type="button" className="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div className="toast-body">
              {this.state.waiting === true ?
                (
                  <>
                    Swap pending. Wait please.
                  </>
                ) : (
                  <>
                    Success : {this.state.tx?.hash}
                  </>
                ) 
              }
            </div>
          </div>
        </div>
      </>
    );
  }
}
