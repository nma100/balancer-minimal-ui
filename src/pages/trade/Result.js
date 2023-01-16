import React from 'react';
import { transactionUrl } from '../../networks';
import { isDark } from '../../theme';
import { OutletContext } from '../Layout';
import Amounts from './Amounts';

export const RESULT_TOAST = 'result';

export class Result extends React.Component {
      
  static contextType = OutletContext;

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() { 
    const toast = document.getElementById(RESULT_TOAST);
    toast.addEventListener('show.bs.toast', this.onShow.bind(this));
  }
    
  async onShow() {
    const { swapInfo, tx } = this.props;

    this.setState({ waiting: true });
    await tx.wait();
    this.setState({ waiting: false });
    
    swapInfo.onSwapped();
  }

  css() {
    const { theme } = this.context;
    const contentClass = isDark(theme) ? 'text-bg-dark' : 'text-bg-white';
    const linkClass = isDark(theme) ? 'link-light' : 'link-dark';
    const mutedClass = isDark(theme) ? 'text-light text-opacity-50' : 'text-muted';
    const btnCloseClass = isDark(theme) ? 'btn-close-white' : '';
    const successClass = isDark(theme) ? 'success-dark' : 'success-light';
    return { contentClass, mutedClass, btnCloseClass, linkClass, successClass };
  }

  render() {
    const { swapInfo } = this.props;
    const { chainId } = this.context;
    const { contentClass, mutedClass, linkClass, btnCloseClass, successClass } = this.css();
    const txHash = this.props.tx?.hash;
    return ( 
      <div className="toast-container position-fixed bottom-0 end-0 p-3">
        <div id={RESULT_TOAST} className={`toast ${contentClass}`} role="alert" aria-live="assertive" aria-atomic="true"  data-bs-autohide="false">
          <div className="toast-body">
            <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
                <h5 className="mb-0">Swap pending</h5> 
                <button type="button" className={`btn-close ${btnCloseClass}`} data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div className="text-center fs-4 mb-3"><Amounts swapInfo={swapInfo} /></div>
            <div className="text-center">
            {this.state.waiting ?
              (
                <div className={`fs-6 d-flex justify-content-center align-items-center ${mutedClass}`}>Wait please
                  <div className="spinner-border ms-2" style={{width: '1.2rem', height: '1.2rem'}} role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className={`text-center`}>
                  <div className={`${successClass} fs-5 fw-bold mb-3`}>Success !</div>
                  <a href={transactionUrl(chainId, txHash)} className={`${linkClass} text-decoration-none`} target="_blank" rel="noreferrer" >
                    Transaction <i className="bi bi-box-arrow-up-right"></i>
                  </a>
                </div>
              ) 
            }
            </div>
          </div>
        </div>
      </div>
    );
  }
}
