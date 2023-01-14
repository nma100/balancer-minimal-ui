import React from 'react';
import { isDark } from '../../theme';
import { hideModal, openToast } from '../../utils/page';
import { OutletContext } from '../Layout';
import { constants } from 'ethers';
import { bn, bnf } from '../../utils/bn';
import { nf } from '../../utils/number';
import { Result, RESULT_TOAST } from './Result';

export const PREVIEW_MODAL = 'preview';

const { MaxUint256, AddressZero } = constants;

const Mode = {
  Init: 0,
  NoBalance: 1,
  Allowance: 2,
  Approve: 3,
  Swap : 4,
  Confirm : 5,
  Executed : 6,
}

const MIN_PI = 0.01;

export class Preview extends React.Component {
      
  static contextType = OutletContext;

  constructor(props) {
    super(props);
    this.state = { mode: Mode.Init };
  }

  componentDidMount() { 
    const modal = document.getElementById(PREVIEW_MODAL);
    modal.addEventListener('show.bs.modal', this.onShow.bind(this));
    modal.addEventListener('hidden.bs.modal', this.onHidden.bind(this));
  }
  
  async onShow() {
    const { account, balancer } = this.context;
    const { tokenIn }  = this.props.swapInfo.tokens;
    const { amountIn } = this.props.swapInfo.priceInfo.amounts;
    const { vault } = balancer.networkConfig().addresses.contracts;

    if (!account) return;

    const balanceIn = await balancer.userBalance(account, tokenIn);

    let mode;

    if (balanceIn.lt(amountIn)) {
      mode = Mode.NoBalance;
    } else if (tokenIn.address === AddressZero) {
      mode = Mode.Swap;
    } else {
      const allowance = await balancer.allowance(account, vault, tokenIn);
      mode = allowance.gte(amountIn) ? Mode.Swap : Mode.Allowance;
    }

    this.setState({ mode });
  }

  onHidden() {
    const { mode} = this.state;
    if (mode === Mode.Executed) {
      openToast(RESULT_TOAST);
    }
    this.setState({ mode: Mode.Init });
  }

  async handleApprove() {
    const { balancer, web3Provider } = this.context;
    const { tokenIn } = this.props.swapInfo.route;
    const { vault } = balancer.networkConfig().addresses.contracts;
    const signer = web3Provider.getSigner();

    this.setState({ mode: Mode.Approve });

    const tx = await balancer
      .ERC20(tokenIn, signer)
      .approve(vault, MaxUint256);
    await tx.wait();

    this.setState({ mode: Mode.Swap });
  }
      
  async handleSwap() {
    const { swapInfo } = this.props;
    const { balancer, web3Provider } = this.context;

    this.setState({ mode: Mode.Confirm });

    const tx = await balancer.swap(swapInfo, web3Provider);
    const callback = () => hideModal(PREVIEW_MODAL);
    
    this.setState({ mode: Mode.Executed, tx }, callback);
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

  effectivePrice() {
    const { swapInfo } = this.props;
    const tokens = swapInfo?.tokens;
    const effectivePrice = swapInfo?.priceInfo?.effectivePrice;
    return `1 ${tokens?.tokenIn.symbol} = ${bnf(effectivePrice, 5)} ${tokens?.tokenOut.symbol}`;
  }

  maxSlippage() {
    const ms = this.props.swapInfo?.maxSlippage;
    return ms ? `${nf(ms / 100)}%` : '—';
  }

  priceImpact() {
    const { swapInfo } = this.props;
    const pi = swapInfo?.priceInfo?.priceImpact
    return pi < MIN_PI ?  `< ${nf(MIN_PI)}%` : `${nf(pi)}%`;
  }

  css() {
    const { theme } = this.context;
    const contentClass = isDark(theme) ? 'bg-dark text-light' : 'bg-light text-dark';
    return { contentClass };
  }

  spinner() {
    return (
      <div className="spinner-border spinner-border-sm ms-2" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    );
  }

  render() {
    const { contentClass } = this.css();
    const { mode, tx } = this.state;
    const { swapInfo } = this.props;
    const tokens = swapInfo?.tokens;
    return ( 
      <>
        <Result swapInfo={swapInfo} tx={tx} />
        <div id={PREVIEW_MODAL} className="modal" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
                <div className={`modal-content ${contentClass}`}>
                    <div className="modal-body">
                      <div className="text-center border rounded py-4 px-3 mb-2">
                        <div className="fs-3 mb-2">{ this.tradeAmount() }</div> 
                        <div className="text-muted">{ this.effectivePrice() }</div>
                      </div>
                      <div className="d-flex small mb-4">
                        <span className="me-auto">Price impact : { this.priceImpact() }</span>
                        Max slippage : { this.maxSlippage() }
                      </div>
                      {!this.context.account ? (
                        <button type="button" className="btn btn-secondary" disabled>
                          Connect wallet
                        </button>
                      ) : (
                        <>
                          {mode === Mode.Init &&
                            <button type="button" className="btn btn-secondary" disabled>
                              Initialisation {this.spinner()}
                            </button>
                          }
                          {mode === Mode.NoBalance &&
                            <button type="button" className="btn btn-secondary" disabled>
                              Insufficient {tokens?.tokenIn?.symbol} balance
                            </button>
                          }
                          {mode === Mode.Allowance &&
                            <button type="button" className="btn btn-secondary" onClick={e => this.handleApprove(e)}>
                              Approve {tokens?.tokenIn?.symbol}
                            </button>
                          }
                          {mode === Mode.Approve &&
                            <button type="button" className="btn btn-secondary" disabled>
                              Approving {tokens?.tokenIn?.symbol} {this.spinner()}
                            </button>
                          }
                          {mode === Mode.Swap &&
                            <button type="button" className="btn btn-secondary" onClick={e => this.handleSwap(e)}>
                              Swap
                            </button>
                          }
                          {mode === Mode.Confirm &&
                            <button type="button" className="btn btn-secondary" disabled>
                              Confirmation {this.spinner()}
                            </button>
                          }
                        </>
                      )}
                    </div>
                </div>
            </div>
        </div>
      </>
    );
  }
}
