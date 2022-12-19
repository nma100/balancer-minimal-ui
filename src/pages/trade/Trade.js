import React from 'react';
import CryptoIcon from '../../components/CryptoIcon';
import { Modal } from 'bootstrap';
import { SELECT_TOKEN_MODAL, TokenSelector } from './TokenSelector';
import { OutletContext } from '../Layout';
import { fdollar } from '../../utils/page';
import { formatUnits, parseUnits } from 'ethers/lib/utils';

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
    console.log('onTokenSelect', token);
    const { mode, kind, tokenOut } = this.state;
    const callBack = () => this.handleAmountChange(IN);
    if (kind === IN) {
      if (mode === Mode.Init && tokenOut !== undefined) {
        this.setState({tokenIn: token, mode: Mode.TokensSelected}, callBack);
      } else {
        this.setState({tokenIn: token}, callBack);
      }
    } else {
      if (mode === Mode.Init) {
        this.setState({tokenOut: token, mode: Mode.TokensSelected}, callBack);
      } else {
        this.setState({tokenOut: token}, callBack);
      }
    }
  }

  async handleAmountChange(kind) {
  
    const { mode } = this.state;

    let inElement, outElement;
    if (kind === IN) {
      inElement = this.amountElement(IN);
      outElement = this.amountElement(OUT);
    } else {
      inElement = this.amountElement(OUT);
      outElement = this.amountElement(IN);
    }

    console.log('handleAmountChange', kind, inElement.value);

    const amount = Number(inElement.value);
    if (isNaN(amount) || amount === 0) return;

    if (mode > Mode.Init) {
      outElement.value = '';
      outElement.value = await this.calcAmount(kind, inElement.value);
    }

    if (amount > 0) {
      if (mode === Mode.TokensSelected) {
        this.setState({ mode: Mode.AmountEntered });
      }
    } else {
      if (mode === Mode.AmountEntered) {
        this.setState({ mode: Mode.TokensSelected });
      }
    }
  }

  async calcAmount(kind, amount) {
    const { balancer, nativeAsset } = this.context;
    const { tokenIn, tokenOut } = this.state;
    const tokenInOk = tokenIn ?  tokenIn : nativeAsset;
    console.log('calcAmount', nativeAsset, tokenInOk, tokenOut, amount);
    let route, returnAmount;
    if (kind === IN) {
      const amountIn = parseUnits(amount, tokenInOk.decimals);
      route = await balancer.findRouteGivenIn(tokenInOk.address, tokenOut.address, amountIn);
      console.log(`Route given in ${tokenInOk.symbol} -> ${tokenOut.symbol}`, route);
      returnAmount = formatUnits(route.returnAmount, tokenOut.decimals);
    } else {
      const amountOut = parseUnits(amount, tokenOut.decimals);
      route = await balancer.findRouteGivenOut(tokenInOk.address, tokenOut.address, amountOut);
      console.log(`Route given out ${tokenInOk.symbol} -> ${tokenOut.symbol}`, route);
      returnAmount = formatUnits(route.returnAmount, tokenInOk.decimals);
    }
    console.log('swapAmount', formatUnits(route.swapAmount));
    console.log('Return amount', returnAmount);
    if (route.returnAmount.isZero()) {
      console.warn('No swap route');
    }
    return returnAmount;
  }
  
  amountElement(kind) {
    const suffix = kind === IN  ? 'in' : 'out';
    return document.getElementById(`amount-${suffix}`);
  }

  render() {
    const { nativeAsset } = this.context;
    let { tokenIn, tokenOut, usdIn, usdOut, 
      balanceIn, balanceOut, price: effectivePrice, mode } = this.state;
    balanceIn = balanceOut = usdIn = usdOut = 0;
    effectivePrice = '';
    return (
      <>
        <TokenSelector onTokenSelect={this.onTokenSelect.bind(this)} />
        {mode}
        <div id="swap" className="row">
          <div className="col-12 col-lg-8 col-xxl-6">
            <div className="bg-dark bg-gradient rounded shadow p-3 pt-2">
              <div className="pb-4 d-flex justify-content-between align-items-center">
                <div className="fs-1">Swap tokens</div>
                <div className="d-flex align-items-center">
                  {mode > Mode.Init &&
                    <span className="text-light text-opacity-50 me-3">{effectivePrice}</span>
                  }
                  <i className="bi bi-gear fs-4 me-1"></i>
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center bg-light bg-opacity-10 rounded px-4 py-2">
                <div className="amount-block">
                  <div className="fs-1 mb-1">
                    <input id="amount-in" type="text" autoComplete="off" placeholder="0" onChange={() => this.handleAmountChange(IN)} />
                  </div>
                  <div className="text-light text-opacity-75">{fdollar(usdIn)}</div>
                </div>
                <div>
                  <div className="select-token d-flex bg-light bg-opacity-10 rounded-5 shadow px-3 py-2 mb-2" onClick={() => this.openTokenSelector(IN)}>
                  {tokenIn ? (
                    <>
                      <CryptoIcon key={tokenIn.symbol} name={tokenIn.symbol} cssClass="me-3" /> 
                      <span className="fs-5 me-3">{tokenIn.symbol}</span> 
                    </>
                  ) : (
                    <>
                      <CryptoIcon key={nativeAsset.symbol} name={nativeAsset.symbol} cssClass="me-3" /> 
                      <span className="fs-5 me-3">{nativeAsset.symbol}</span> 
                    </>
                  )}
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
                    <input id="amount-out" type="text" autoComplete="off" placeholder="0" onChange={() => this.handleAmountChange(OUT)} />
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
                    <button className="btn btn-secondary btn-lg fs-4" type="button">Swap</button>
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