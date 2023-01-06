import React from 'react';
import { isDark } from '../../theme';
import { hideModal, openToast } from '../../utils/page';
import { OutletContext } from '../Layout';
import { constants } from 'ethers';
import { bnumf } from '../../utils/bnum';
import { Result, RESULT_TOAST } from './Result';

export const PREVIEW_MODAL = 'preview';

const { MaxUint256 } = constants;

const Mode = {
  Init: 'init',
  Allowance: 'allow',
  Swap : 'swap',
  Executed : 'Exec'
}

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
    const { account, balancer, web3Provider } = this.context;
    const { tokenIn, swapAmount } = this.props.swapInfo.route;
    const { vault } = balancer.networkConfig().addresses.contracts;

    const allowance = await balancer
      .ERC20(tokenIn, web3Provider)
      .allowance(account, vault);

    const mode = allowance.gte(swapAmount) ? Mode.Swap : Mode.Allowance;
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

    const tx = await balancer
      .ERC20(tokenIn, signer)
      .approve(vault, MaxUint256);
    await tx.wait();

    this.setState({ mode: Mode.Swap });
  }
      
  async handleSwap() {
    const { balancer, web3Provider, account } = this.context;
    const { route, kind } = this.props.swapInfo;
    const signer = web3Provider.getSigner();

    const tx = await balancer.swap(route, kind, signer, account);
    const callback = () => hideModal(PREVIEW_MODAL);
    this.setState({ mode: Mode.Executed, tx }, callback);
  }

  css() {
    const { theme } = this.context;
    const contentClass = isDark(theme) ? 'bg-dark text-light' : 'bg-light text-dark';
    return { contentClass };
  }

  render() {
    const { contentClass } = this.css();
    const { mode, tx } = this.state;
    const { swapInfo } = this.props;
    const priceInfo = swapInfo?.priceInfo;
    return ( 
      <>
        <Result tx={tx} />
        <div id={PREVIEW_MODAL} className="modal" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
                <div className={`modal-content ${contentClass}`}>
                    <div className="modal-body">
                      <div className="text-center border rounded fs-3 py-4 px-3 mb-2">
                        {bnumf(priceInfo?.amounts?.amountIn)} {swapInfo?.tokenIn?.symbol} <i className="bi bi-arrow-right"></i> {bnumf(priceInfo?.amounts?.amountOut)} {swapInfo?.tokenOut?.symbol} 
                      </div>
                      <div className="d-flex small mb-4">
                        <span className="me-auto">Price impact : {bnumf(priceInfo?.priceImpact, 3)}%</span>
                        Max slippage : —
                      </div>
                      {!this.context.account ? (
                        <button type="button" className="btn btn-secondary" disabled>
                          Connect wallet
                        </button>
                      ) : (
                        <>
                          {mode === Mode.Init &&
                            <button type="button" className="btn btn-secondary" disabled>
                                Initialisation
                                <div className="spinner-border spinner-border-sm ms-2" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </button>
                          }
                          {mode === Mode.Allowance &&
                            <button type="button" className="btn btn-secondary" onClick={e => this.handleApprove(e)}>
                              Approve token transfer
                            </button>
                          }
                          {mode === Mode.Swap &&
                            <button type="button" className="btn btn-secondary" onClick={e => this.handleSwap(e)}>
                              Swap
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
