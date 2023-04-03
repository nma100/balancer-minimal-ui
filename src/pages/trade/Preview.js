import React from 'react';
import { isDark } from '../../theme';
import { hideModal, openToast } from '../../utils/page';
import { OutletContext } from '../Layout';
import { constants } from 'ethers';
import { bnt } from '../../utils/bn';
import { nf } from '../../utils/number';
import { Result, RESULT_TOAST } from './Result';
import Amounts from './Amounts';
import Spinner from '../../components/Spinner';

export const PREVIEW_MODAL = 'preview';

const { MaxUint256, AddressZero } = constants;

const Mode = {
  Init: 0,
  InsufficientBalance: 1,
  Allowance: 2,
  Approve: 3,
  Swap : 4,
  Confirm : 5,
  Executed : 6,
}

const MIN_PI = 0.001, PRECISION = 3;

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
      mode = Mode.InsufficientBalance;
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

  effectivePrice() {
    const { swapInfo } = this.props;
    const tokens = swapInfo?.tokens;
    const effectivePrice = swapInfo?.priceInfo?.effectivePrice;
    return `1 ${tokens?.tokenOut.symbol} = ${bnt(effectivePrice, 5)} ${tokens?.tokenIn.symbol}`;
  }

  maxSlippage() {
    const ms = this.props.swapInfo?.maxSlippage;
    return ms ? `${nf(ms / 100)}%` : '—';
  }

  priceImpact() {
    const { swapInfo } = this.props;
    const pi = swapInfo?.priceInfo?.priceImpact?.toNumber() || 0;
    return pi < MIN_PI ? `< ${nf(MIN_PI, PRECISION)}%` : `${nf(pi, PRECISION)}%`;
  }

  css() {
    const { theme } = this.context;
    const amountsClass  = isDark(theme) ? 'bg-light' : 'bg-dark';
    const btnCloseClass = isDark(theme) ? 'btn-close-white' : '';
    const contentClass  = isDark(theme) ? 'bg-dark text-light' : 'bg-white text-dark';
    const effPriceClass = isDark(theme) ? 'text-light text-opacity-50' : 'text-dark text-opacity-75';
    const btnClass = isDark(theme) ? 'btn btn-secondary btn-lg ' : 'btn btn-light btn-lg border shadow-sm';
    return { contentClass, amountsClass, effPriceClass, btnClass, btnCloseClass };
  }

  render() {
    const { 
      contentClass, amountsClass, effPriceClass, 
      btnClass, btnCloseClass 
    } = this.css();
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
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h3 className="m-0">Preview</h3> 
                        <button type="button" className={`btn-close ${btnCloseClass}`} data-bs-dismiss="modal" aria-label="Close"></button>
                      </div>
                      <div className={`text-center rounded py-4 px-3 mb-2 ${amountsClass} bg-opacity-10`}>
                        <div className="fs-3 mb-2"><Amounts swapInfo={swapInfo} /></div> 
                        <div className={effPriceClass}>{ this.effectivePrice() }</div>
                      </div>
                      <div className="d-flex small mb-4">
                        <span className="me-auto">Price impact : { this.priceImpact() }</span>
                        Max slippage : { this.maxSlippage() }
                      </div>
                      <div className="d-grid pt-1">
                      {!this.context.account ? (
                        <button type="button" className={btnClass} disabled>
                          Connect your wallet
                        </button>
                      ) : (
                        <>
                          {mode === Mode.Init &&
                            <button type="button" className={btnClass} disabled>
                              Initialisation <Spinner />
                            </button>
                          }
                          {mode === Mode.InsufficientBalance &&
                            <button type="button" className={btnClass} disabled>
                              Insufficient {tokens?.tokenIn?.symbol} balance
                            </button>
                          }
                          {mode === Mode.Allowance &&
                            <button type="button" className={btnClass} onClick={e => this.handleApprove(e)}>
                              Approve {tokens?.tokenIn?.symbol}
                            </button>
                          }
                          {mode === Mode.Approve &&
                            <button type="button" className={btnClass} disabled>
                              Approving {tokens?.tokenIn?.symbol} <Spinner />
                            </button>
                          }
                          {mode === Mode.Swap &&
                            <button type="button" className={btnClass} onClick={e => this.handleSwap(e)}>
                              Swap
                            </button>
                          }
                          {mode === Mode.Confirm &&
                            <button type="button" className={btnClass} disabled>
                              Confirmation <Spinner />
                            </button>
                          }
                        </>
                      )}
                      </div>
                    </div>
                </div>
            </div>
        </div>
      </>
    );
  }
}
