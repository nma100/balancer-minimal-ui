import React from 'react';
import CryptoIcon from '../../components/CryptoIcon';
import { Modal } from 'bootstrap';
import { TokenSelector, SELECT_TOKEN_MODAL } from './TokenSelector';
import { OutletContext } from '../Layout';
import { fdollar } from '../../utils/page';
import { formatUnits, parseUnits } from 'ethers/lib/utils';
import { bnum } from '../../utils/bnum';
import { Preview, PREVIEW_MODAL } from './Preview';

const IN = 0, OUT = 1;

const Mode = {
  Init: 0,
  TokensSelected : 1,
  AmountEntered : 2,
  Executed : 3,
}

class Trade extends React.Component {

  static contextType = OutletContext;

  constructor(props) {
    super(props);
    this.state = { mode: Mode.Init };
  }

  async componentDidMount() { 
    this.amountElement(IN).focus();
  }

  openTokenSelector(kind) {
    this.setState({kind: kind});
    Modal.getOrCreateInstance(`#${SELECT_TOKEN_MODAL}`).show();
  }

  onTokenSelect(token) {
    const { mode, kind } = this.state;
    const callBack = () => this.handleAmountChange(IN);
    if (kind === IN) {
      this.setState({tokenIn: token}, callBack);
    } else {
      if (mode === Mode.Init) {
        this.setState({mode: Mode.TokensSelected});
      } 
      this.setState({tokenOut: token}, callBack);
    }
  }

  async handleAmountChange(kind) {
  
    const { mode } = this.state;

    let inElement, outElement;
    if (kind === IN) {
      inElement  = this.amountElement(IN);
      outElement = this.amountElement(OUT);
    } else {
      inElement  = this.amountElement(OUT);
      outElement = this.amountElement(IN);
    }

    if (bnum(inElement.value).isZero()) {
      inElement.value = outElement.value = '';
      if (mode === Mode.AmountEntered) {
        this.setState({ mode: Mode.TokensSelected });
      }
    } else {
      if (mode >= Mode.TokensSelected) {
        outElement.value = await this.fetchAmount(kind, inElement.value);
      }
      if (mode === Mode.TokensSelected) {
        this.setState({ mode: Mode.AmountEntered });
      }
    }
  }

  handleSwap() {
    const { kind, route, tokenOut} = this.state;
    this.setState({
      swapInfo: {
        kind: kind,
        tokenIn: this.tokenIn(),
        tokenOut: tokenOut,
        route: route,
      }
    });
    Modal.getOrCreateInstance(`#${PREVIEW_MODAL}`).show();
  }

  async fetchAmount(kind, amount) {
    const { balancer } = this.context;
    const { tokenOut } = this.state;
    const tokenIn = this.tokenIn();
    console.log('calcAmount', tokenIn, tokenOut, amount);
    let route, returnAmount;
    if (kind === IN) {
      const amountIn = parseUnits(amount, tokenIn.decimals);
      route = await balancer.findRouteGivenIn(tokenIn.address, tokenOut.address, amountIn);
      console.log(`Route given in ${tokenIn.symbol} -> ${tokenOut.symbol}`, route);
      returnAmount = formatUnits(route.returnAmount, tokenOut.decimals);
    } else {
      const amountOut = parseUnits(amount, tokenOut.decimals);
      route = await balancer.findRouteGivenOut(tokenIn.address, tokenOut.address, amountOut);
      console.log(`Route given out ${tokenIn.symbol} -> ${tokenOut.symbol}`, route);
      returnAmount = formatUnits(route.returnAmount, tokenIn.decimals);
    }
    console.log('swapAmount', formatUnits(route.swapAmount));
    console.log('Return amount', returnAmount);
    this.setState({route: route});
    if (route.returnAmount.isZero()) {
      console.warn('No swap route');
    }
    return returnAmount;
  }

  tokenIn() {
    const { tokenIn } = this.state;
    const { nativeAsset } = this.context;
    return tokenIn ?  tokenIn : nativeAsset;
  }
  
  amountElement(kind) {
    const suffix = kind === IN  ? 'in' : 'out';
    return document.getElementById(`amount-${suffix}`);
  }

  render() {
    let { tokenOut, usdIn, usdOut, 
      balanceIn, balanceOut, price: effectivePrice, mode, swapInfo } = this.state;
    balanceIn = balanceOut = usdIn = usdOut = 0;
    const tokenIn = this.tokenIn();
    effectivePrice = '';
    return (
      <>
        <TokenSelector onTokenSelect={this.onTokenSelect.bind(this)} />
        <Preview swapInfo={swapInfo} />
        <div id="swap" className="row">
          <div className="col-12 col-lg-8 col-xxl-6">
            <div className="bg-dark bg-gradient rounded shadow p-3 pt-2">
              <div className="pb-4 d-flex justify-content-between align-items-center">
                <div className="fs-1">Swap tokens</div>
                <div className="d-flex align-items-center">
                  {mode >= Mode.AmountEntered &&
                    <span className="text-light text-opacity-50 me-3">{effectivePrice}</span>
                  }
                  <i className="bi bi-gear fs-4 me-1"></i>
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center bg-light bg-opacity-10 rounded px-4 py-2">
                <div className="amount-block">
                  <div className="fs-1 mb-1">
                    <input id="amount-in" type="number" autoComplete="off" placeholder="0" min="0" step="any" onChange={() => this.handleAmountChange(IN)} />
                  </div>
                  <div className="text-light text-opacity-75">{fdollar(usdIn)}</div>
                </div>
                <div>
                  <div className="select-token d-flex bg-light bg-opacity-10 rounded-5 shadow px-3 py-2 mb-2" onClick={() => this.openTokenSelector(IN)}>
                    <CryptoIcon key={tokenIn.symbol} name={tokenIn.symbol} cssClass="me-3" /> 
                    <span className="fs-5 me-3">{tokenIn.symbol}</span> 
                    <i className="bi bi-chevron-down align-self-center"></i>
                  </div>
                  <div className="text-center small">
                    Balance : {balanceIn} {balanceIn > 0 && <><span className="px-1">·</span> <a href="/" className="link-light">Max</a></>}
                  </div>
                </div>
              </div>
              <div className="separator-line position-relative">
                <div className="progress">
                  <div className="progress-bar" role="progressbar" aria-label="Progress" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <div className="arrow position-absolute top-0 start-50 translate-middle bg-secondary rounded-5 d-none d-sm-flex justify-content-center align-items-center">
                  <i className="bi bi-arrow-down"></i>
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center bg-light bg-opacity-10 rounded px-4 py-2 mb-3">
                <div className="amount-block">
                  <div className="fs-1 mb-1">
                    <input id="amount-out" type="number" autoComplete="off" placeholder="0" min="0" step="any" onChange={() => this.handleAmountChange(OUT)} />
                  </div>
                  <div className="text-light text-opacity-75">{fdollar(usdOut)}</div>
                </div>
                <div>
                  <div className="select-token d-flex bg-light bg-opacity-10 rounded-5 shadow px-3 py-2 mb-2" onClick={() => this.openTokenSelector(OUT)}>
                    {mode === Mode.Init 
                      ? <span className="fs-5 me-3">Select token</span>
                      : (
                        <>
                          {tokenOut && (
                              <>
                                <CryptoIcon key={tokenOut.symbol} name={tokenOut.symbol} cssClass="me-3" /> 
                                <span className="fs-5 me-3">{tokenOut.symbol}</span>
                              </>
                          )}
                        </>
                      ) 
                    } <i className="bi bi-chevron-down align-self-center"></i>               
                  </div>
                  <div className="text-center small">Balance : {balanceOut}</div>
                </div>
              </div>
              <div className="d-grid">
              {!this.context.account ? 
                  <button className="btn btn-secondary btn-lg fs-4" type="button" disabled>Connect wallet</button>
                : (
                <>
                  {mode === Mode.Init &&
                    <button className="btn btn-secondary btn-lg fs-4" type="button" disabled>Select token</button>
                  }
                  {mode === Mode.TokensSelected &&
                    <button className="btn btn-secondary btn-lg fs-4" type="button" disabled>Enter amount</button>
                  }
                  {mode === Mode.AmountEntered &&
                    <button className="btn btn-secondary btn-lg fs-4" type="button" onClick={() => this.handleSwap()}>Swap</button>
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

export default Trade;