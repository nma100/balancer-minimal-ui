/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import CryptoIcon from '../../components/CryptoIcon';
import { TokenSelector, SELECT_TOKEN_MODAL } from '../../components/TokenSelector';
import { Preview, PREVIEW_MODAL } from './Preview';
import { Settings, SETTINGS_MODAL } from './Settings';
import { OutletContext } from '../Layout';
import { dollar, openModal } from '../../utils/page';
import { bnum, bnumf, fromEthersBnum, ROUND_DOWN, ZERO } from '../../utils/bnum';
import { debounce } from 'lodash';

const IN = 0, OUT = 1;

const DEBOUNCE = 1000;
const PRECISION = 5;
const SLIPPAGE = 50;

const Mode = {
  Init: 0,
  TokensSelected: 1,
  FetchPrice : 2,
  NoRoute: 3,
  SwapReady: 4,
}

class Trade extends React.Component {

  static contextType = OutletContext;

  constructor(props) {
    super(props);
    this.state = { 
      mode: Mode.Init, 
      maxSlippage: SLIPPAGE, 
    };
    this.findRoute = debounce(
      this.findRoute.bind(this),
      DEBOUNCE
    );
  }

  openTokenSelector(type) {
    const callBack = () => openModal(SELECT_TOKEN_MODAL);
    this.setState({ tokenSelect: type }, callBack);
  }

  onTokenSelect(token) {
    const { mode, tokenSelect } = this.state;
    const callBack = () => { 
      this.updateBalance(tokenSelect);
      this.handleAmountChange(IN);
    }
    if (tokenSelect === IN) {
      this.setState({ tokenIn: token }, callBack);
    } else {
      if (mode === Mode.Init) {
        this.setState({ mode: Mode.TokensSelected });
      } 
      this.setState({ tokenOut: token }, callBack);
    }
  }

  openSettings() {
    const settingsInfo = {
        maxSlippage: this.state.maxSlippage,
        onSave: this.onSaveSettings.bind(this),
    }
    const callback = () => openModal(SETTINGS_MODAL);
    this.setState({ settingsInfo }, callback);
  }

  onSaveSettings(settings) {
    const { maxSlippage } = settings;
    this.setState({ maxSlippage });
  }

  async updateUsdValue(kind) {
    const { balancer } = this.context;
    const { tokenIn, tokenOut } = this.tokens();
    const { amountIn, amountOut } = this.amounts();

    const token  = kind === IN ? tokenIn : tokenOut;
    const amount = kind === IN ? amountIn.value : amountOut.value;

    const usdValue = await balancer.fetchPrice(token.address, bnum(amount));

    if (kind === IN) {
      this.setState({ usdValueIn:  usdValue })
    } else {
      this.setState({ usdValueOut: usdValue })
    }
  }

  async updateBalance(kind) {
    const { balancer, account } = this.context;
    const { tokenIn, tokenOut } = this.tokens();

    if (!account) return;

    const token = kind === IN ? tokenIn : tokenOut;
    const balance = await balancer.userBalance(account, token);

    if (kind === IN) {
      this.setState({ balanceIn:  balance });
    } else {
      this.setState({ balanceOut: balance });
    }
  }

  async handleAmountChange(kind) {
    console.time('handleAmountChange');
    const { mode} = this.state;
    const { amountIn, amountOut } = this.amounts();

    const entered = kind === IN ? amountIn : amountOut;
    const calculated = kind === IN ? amountOut : amountIn;

    if (bnum(entered.value).isZero()) {
      if (mode > Mode.TokensSelected) {
        this.setState({ mode: Mode.TokensSelected });
      }
      calculated.value = '';
      this.setState({ usdValueIn: ZERO, usdValueOut: ZERO });
    } else {
      if (mode >= Mode.TokensSelected) {
        this.setState({ mode: Mode.FetchPrice });
        this.findRoute(kind, entered, calculated); 
      }
    }
    console.timeEnd('handleAmountChange');
  }

  async findRoute(kind, entered, calculated) {
    const tokens = this.tokens();
    const { balancer } = this.context;
    const { tokenIn, tokenOut } = tokens;
    this.updateUsdValue(kind);
    const route = await balancer.findRoute(kind, tokens, entered.value);
    console.log('Route', route);
    if (route.returnAmount.isZero()) {
      this.setState({ mode: Mode.NoRoute });
      calculated.value = '';
      if (kind === IN) {
        this.setState({ usdValueOut: ZERO });
      } else {
        this.setState({ usdValueIn: ZERO });
      }
    } else {
      const priceInfo = balancer.priceInfo(route, kind, tokens);
      this.setState({ mode: Mode.SwapReady, route, kind, priceInfo });
      let returned;
      if (kind === IN) {
        returned = fromEthersBnum(route.returnAmount, tokenOut.decimals);
      } else {
        returned = fromEthersBnum(route.returnAmount, tokenIn.decimals);
      }
      calculated.value = bnumf(returned, PRECISION);
      this.updateUsdValue(kind === IN ? OUT : IN);
    }
  }

  handleMaxBalance(event) {
    event.preventDefault();
    const { balanceIn } = this.balances();
    const { amountIn  } = this.amounts();
    amountIn.value = bnumf(balanceIn, PRECISION, ROUND_DOWN);
    this.handleAmountChange(IN);
  }

  handleSwap() {
    const { coin } = this.context.nativeCoin;
    const callback = () => openModal(PREVIEW_MODAL);
    this.setState(state => ({
      swapInfo: {
        tokens: {
          tokenIn: state.tokenIn ?? coin,
          tokenOut: state.tokenOut,
        },
        route: state.route,
        kind:  state.kind,
        priceInfo: state.priceInfo,
        maxSlippage: state.maxSlippage,
        onSwapped: this.resetAmounts.bind(this),
      }
    }), callback);
  }

  tokens() {
    const coin = this.context.nativeCoin?.coin;
    const { tokenIn, tokenOut } = this.state;
    return { tokenIn: tokenIn ?? coin, tokenOut };
  }

  balances() {
    const balance = this.context.nativeCoin?.balance;
    const { balanceIn, balanceOut } = this.state;
    return { balanceIn: balanceIn ?? balance, balanceOut };
  }

  amounts() {
    const amountIn  = document.getElementById('amount-in');
    const amountOut = document.getElementById('amount-out');
    return { amountIn, amountOut };
  }

  resetAmounts() {
    const { mode } = this.state;
    const { amountIn, amountOut } = this.amounts();
    if (mode > Mode.TokensSelected) {
      this.setState({ mode: Mode.TokensSelected });
    }
    amountIn.value = amountOut.value  = '';
    this.setState({ usdValueIn: ZERO, usdValueOut: ZERO });
  }

  effectivePrice() {
    const { tokenIn, tokenOut } = this.tokens();
    const { effectivePrice } = this.state.priceInfo;
    return `1 ${tokenIn.symbol} = ${bnumf(effectivePrice, PRECISION)} ${tokenOut.symbol}`;
  }

  render() {
    const { 
      mode, usdValueIn, usdValueOut, swapInfo, settingsInfo 
    } = this.state;
    const { tokenIn, tokenOut } = this.tokens();
    const { balanceIn, balanceOut }  = this.balances();
    return (
      <>
        <TokenSelector onTokenSelect={this.onTokenSelect.bind(this)} />
        <Settings settingsInfo={settingsInfo} />
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
                  <div id="settings" className="fs-4 me-1" onClick={() => this.openSettings()}>
                    <i className="bi bi-gear"></i>
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center bg-light bg-opacity-10 rounded px-4 py-2">
                <div className="amount-block">
                  <div className="fs-1 mb-1">
                    <input id="amount-in" type="number" autoComplete="off" placeholder="0" min="0" step="any" onChange={() => this.handleAmountChange(IN)} />
                  </div>
                  <div className="text-light text-opacity-75">{dollar(usdValueIn)}</div>
                </div>
                <div>
                {tokenIn ? 
                    ( 
                      <div className="select-token d-flex bg-light bg-opacity-10 rounded-5 shadow px-3 py-2 mb-2" onClick={() => this.openTokenSelector(IN)}>
                        <CryptoIcon key={tokenIn.symbol} name={tokenIn.symbol} cssClass="me-3" /> 
                        <span className="fs-5 me-3">{tokenIn.symbol}</span> 
                        <i className="bi bi-chevron-down align-self-center"></i>
                      </div>
                    ) : (
                      <div className="select-token d-flex bg-light bg-opacity-10 rounded-5 shadow px-3 py-2 mb-2">
                        <CryptoIcon key="ETH" name="ETH" cssClass="me-3" /> 
                        <span className="fs-5 me-3">ETH</span> 
                        <i className="bi bi-chevron-down align-self-center"></i>
                      </div>
                    ) 
                  } 
                  <div className="text-center small">
                    <span className="">Balance : {bnumf(balanceIn)}</span> {balanceIn?.gt(0) && ( 
                      <>
                        <span className="px-1">·</span> <a href="#" className="link-light" onClick={(e) => this.handleMaxBalance(e)}>Max</a>
                      </> 
                    )}
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
                  <div className="text-light text-opacity-75">{dollar(usdValueOut)}</div>
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
                  <div className="text-center small">Balance : {bnumf(balanceOut)}</div>
                </div>
              </div>
              <div className="d-grid">
              {
                <>
                  {mode === Mode.Init &&
                    <button className="btn btn-secondary btn-lg fs-4" type="button" disabled>Select token</button>
                  }
                  {mode === Mode.TokensSelected &&
                    <button className="btn btn-secondary btn-lg fs-4" type="button" disabled>Enter amount</button>
                  }
                  {mode === Mode.FetchPrice &&
                    <button className="btn btn-secondary btn-lg fs-4" type="button" disabled>Fetching best price
                      <div className="spinner-border ms-3" style={{width: '1.5rem', height: '1.5rem'}} role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </button>
                  }
                  {mode === Mode.NoRoute &&
                    <button className="btn btn-secondary btn-lg fs-4" type="button" disabled>Insufficient liquidity for this trade</button>
                  }
                  {mode === Mode.SwapReady &&
                    <button className="btn btn-secondary btn-lg fs-4" type="button" onClick={() => this.handleSwap()}>Swap</button>
                  }
                </>
              }  
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default Trade;