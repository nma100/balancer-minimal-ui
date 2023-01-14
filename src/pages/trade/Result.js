import React from 'react';
import { transactionUrl } from '../../networks';
import { bn, bnf } from '../../utils/bn';
import { OutletContext } from '../Layout';

export const RESULT_TOAST  = 'result';

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

  tradeAmount() {
    const { swapInfo } = this.props;
    const tokens = swapInfo?.tokens;
    const priceInfo = swapInfo?.priceInfo;
    return ( 
        <>
          {bn(priceInfo?.amounts?.amountIn).toString()} {tokens?.tokenIn?.symbol} 
          <i className="bi bi-arrow-right mx-3"></i> 
          {bnf(priceInfo?.amounts?.amountOut, 5)} {tokens?.tokenOut?.symbol}
        </>
      );
  }

  render() {
    const { chainId } = this.context;
    const txHash = this.props.tx?.hash;
    return ( 
      <div className="toast-container position-fixed bottom-0 end-0 p-3">
        <div id={RESULT_TOAST} className="toast" role="alert" aria-live="assertive" aria-atomic="true"  data-bs-autohide="false">
          <div className="toast-header">
            <strong className="me-auto">Swap</strong>
            <button type="button" className="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
          <div className="toast-body">
            <p className="text-center">{ this.tradeAmount() }</p>
            {this.state.waiting ?
              (
                <>Swap pending. Wait please.</>
              ) : (
                <>Success : <a href={transactionUrl(chainId, txHash)} target="_blank" rel="noreferrer" >Transaction</a></>
              ) 
            }
          </div>
        </div>
      </div>
    );
  }
}
