import React from 'react';
import CryptoIcon from '../../components/CryptoIcon';
import { TokenSelector, SELECT_TOKEN_MODAL } from './TokenSelector';
import { OutletContext } from '../Layout';
import { fdollar, openModal } from '../../utils/page';
import { formatUnits, parseUnits } from 'ethers/lib/utils';
import { bnum, bnumf, ONE } from '../../utils/bnum';
import { Preview, PREVIEW_MODAL } from './Preview';
import { debounce } from 'lodash';

const IN = 0, OUT = 1;

const Mode = {
  Init: 0,
  TokensSelected: 1,
  NoRoute: 2,
  SwapReady: 3,
}

const DEBOUNCE = 2000;

class Trade extends React.Component {

  static contextType = OutletContext;

  constructor(props) {
    super(props);
    this.state = { mode: Mode.Init };
  }

  async componentDidMount() { 
    this.amountElement(IN).focus();
  }

  openTokenSelector(type) {
    this.setState({tokenSelect: type});
    openModal(SELECT_TOKEN_MODAL);
  }

  onTokenSelect(token) {
    const { mode, tokenSelect } = this.state;
    const callBack = () => this.handleAmountChange(IN);
    if (tokenSelect === IN) {
      this.setState({tokenIn: token}, callBack);
    } else {
      if (mode === Mode.Init) {
        this.setState({mode: Mode.TokensSelected});
      } 
      this.setState({tokenOut: token}, callBack);
    }
  }

  handleAmountChange = debounce(async (kind) => {
    const { mode, tokenOut } = this.state;
    const tokenIn = this.tokenIn();

    let enteredAmount, calculatedAmount;
    if (kind === IN) {
      enteredAmount = this.amountElement(IN);
      calculatedAmount = this.amountElement(OUT);
    } else {
      enteredAmount = this.amountElement(OUT);
      calculatedAmount = this.amountElement(IN);
    }

    if (bnum(enteredAmount.value).isZero()) {
      if (mode > Mode.TokensSelected) {
        this.setState({ mode: Mode.TokensSelected });
      }
      calculatedAmount.value = '';
    } else {
      if (mode >= Mode.TokensSelected) {
        const route = await this.findRoute(kind, enteredAmount.value);
        if (route.returnAmount.isZero()) {
          this.setState({ mode: Mode.NoRoute });
          calculatedAmount.value = '';
        } else {
          const priceInfo = this.priceInfo(route, kind, tokenIn, tokenOut)
          this.setState({ mode: Mode.SwapReady, route, kind, priceInfo });
          if (kind === IN) {
            calculatedAmount.value = this.formatAmount(route.returnAmount, tokenOut.decimals);
          } else {
            calculatedAmount.value = this.formatAmount(route.returnAmount, tokenIn.decimals);
          }
        }
      }
    }
  }, DEBOUNCE);
 
  handleSwap() {
    const { nativeAsset } = this.context;
    this.setState(state => ({
      swapInfo: {
        tokenIn: state.tokenIn ?? nativeAsset,
        tokenOut: state.tokenOut,
        route: state.route,
        kind:  state.kind,
        priceInfo: state.priceInfo,
      }
    }), 
    () => openModal(PREVIEW_MODAL));
  }

  findRoute(kind, amount) {
    const { balancer } = this.context;
    const tokenIn = this.tokenIn();
    const { tokenOut } = this.state;

    if (kind === IN) {
      const amountIn = parseUnits(amount, tokenIn.decimals);
      return balancer.findRouteGivenIn(tokenIn.address, tokenOut.address, amountIn);
    } else {
      const amountOut = parseUnits(amount, tokenOut.decimals);
      return balancer.findRouteGivenOut(tokenIn.address, tokenOut.address, amountOut);
    }
  }

  tokenIn() {
    const { tokenIn } = this.state;
    const { nativeAsset } = this.context;
    return tokenIn ?? nativeAsset;
  }
  
  amountElement(kind) {
    const suffix = kind === IN  ? 'in' : 'out';
    return document.getElementById(`amount-${suffix}`);
  }

  priceInfo(route, kind, tokenIn, tokenOut) {
    let amountIn, amountOut;
    if (kind === IN) {
      amountIn  = formatUnits(route.swapAmount, tokenIn.decimals);
      amountOut = formatUnits(route.returnAmount, tokenOut.decimals);
    } else {
      amountIn  = formatUnits(route.returnAmount, tokenIn.decimals);
      amountOut = formatUnits(route.swapAmount, tokenOut.decimals);
    }
    const spotPrice = ONE.div(bnum(route.marketSp));
    const effectivePrice = bnum(amountOut).div(bnum(amountIn));
    const priceImpact = spotPrice.minus(effectivePrice).div(spotPrice).times(100);
    return { 
      spotPrice, effectivePrice, priceImpact, 
      amounts: { amountIn, amountOut }, 
    };
  }

  effectivePrice() {
    const tokenIn = this.tokenIn();
    const { tokenOut, priceInfo } = this.state;
    const price = bnumf(priceInfo.effectivePrice);
    return `1 ${tokenIn.symbol} = ${price} ${tokenOut.symbol}`;
  }
    
  formatAmount(amount, decimals, precision = 5) {
    const bn = bnum(formatUnits(amount, decimals));
    return bnumf(bn, precision);
  }

  render() {
    let { tokenOut, usdValueIn, usdValueOut, 
      balanceIn, balanceOut, mode, swapInfo } = this.state;
    balanceIn = balanceOut = usdValueIn = usdValueOut = 0;
    const tokenIn = this.tokenIn();
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
                  {mode === Mode.SwapReady &&
                    <span className="text-light text-opacity-50 me-3">{this.effectivePrice()}</span>
                  }
                  <i className="bi bi-gear fs-4 me-1"></i>
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center bg-light bg-opacity-10 rounded px-4 py-2">
                <div className="amount-block">
                  <div className="fs-1 mb-1">
                    <input id="amount-in" type="number" autoComplete="off" placeholder="0" min="0" step="any" onChange={() => this.handleAmountChange(IN)} />
                  </div>
                  <div className="text-light text-opacity-75">{fdollar(usdValueIn)}</div>
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
                  <div className="text-light text-opacity-75">{fdollar(usdValueOut)}</div>
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
                  {mode === Mode.NoRoute &&
                    <button className="btn btn-secondary btn-lg fs-4" type="button" disabled>No swap route</button>
                  }
                  {mode === Mode.SwapReady &&
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