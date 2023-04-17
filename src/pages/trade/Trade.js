/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import CryptoIcon from '../../components/CryptoIcon';
import { TokenSelector, SELECT_TOKEN_MODAL } from '../../components/TokenSelector';
import { Preview, PREVIEW_MODAL } from './Preview';
import { Settings, SETTINGS_MODAL } from './Settings';
import { OutletContext } from '../Layout';
import { usd, openModal, activeInvestMenu } from '../../utils/page';
import { bn, bnt, fromEthersBN, ROUND_DOWN, ROUND_UP, ZERO } from '../../utils/bn';
import { debounce } from 'lodash';
import { Theme } from '../../theme';

const IN = 0, OUT = 1;
const DEBOUNCE = 1000;
const PRECISION = 5;
const SLIPPAGE = 50;

const Mode = {
  Init: 0,
  TokensSelected: 1,
  FetchingPrice : 2,
  NoRouteFound: 3,
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

  componentDidMount() { 
    activeInvestMenu(false);
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

  onSwapped() {
    this.resetAmounts();
    [IN, OUT].forEach(kind => this.updateBalance(kind));
  }

  async updateUsdValue(kind) {
    const { balancer } = this.context;
    const { tokenIn, tokenOut } = this.tokens();
    const { amountInBN, amountOutBN } = this.amounts();

    const token  = kind === IN ? tokenIn : tokenOut;
    const amount = kind === IN ? amountInBN : amountOutBN;

    const usdValue = await balancer.fetchPrice(token?.address, amount);

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
    const { mode} = this.state;
    const { amountIn, amountOut } = this.amounts();

    const entered = kind === IN ? amountIn : amountOut;
    const calculated = kind === IN ? amountOut : amountIn;

    if (bn(entered.value).isZero()) {
      if (mode > Mode.TokensSelected) {
        this.setState({ mode: Mode.TokensSelected });
      }
      calculated.value = '';
      this.setState({ usdValueIn: ZERO, usdValueOut: ZERO });
    } else {
      if (mode >= Mode.TokensSelected) {
        this.setState({ mode: Mode.FetchingPrice });
        this.findRoute(kind, entered, calculated); 
      }
      this.updateUsdValue(kind);
    }
  }

  async findRoute(kind, entered, calculated) {
    const tokens = this.tokens();
    const { balancer } = this.context;
    const { tokenIn, tokenOut } = tokens;
    const route = await balancer.findRoute(kind, tokens, entered.value);
    console.log('Route', route);
    if (route.returnAmount.isZero()) {
      this.setState({ mode: Mode.NoRouteFound });
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
        returned = fromEthersBN(route.returnAmount, tokenOut.decimals);
      } else {
        returned = fromEthersBN(route.returnAmount, tokenIn.decimals);
      }
      calculated.value = bnt(returned, PRECISION);
      this.updateUsdValue(kind === IN ? OUT : IN);
    }
  }

  handleMaxBalance(event) {
    event.preventDefault();
    const { balanceIn } = this.balances();
    const { amountIn  } = this.amounts();
    amountIn.value = bnt(balanceIn, PRECISION, ROUND_DOWN);
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
        onSwapped: this.onSwapped.bind(this),
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
    const amountInBN  = bn(amountIn.value);
    const amountOutBN = bn(amountOut.value);
    return { amountIn, amountOut, amountInBN, amountOutBN };
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
    return `1 ${tokenOut.symbol} = ${bnt(effectivePrice, PRECISION)} ${tokenIn.symbol}`;
  }

  css() {
    const isDark = (this.context.theme === Theme.Dark);
    const amountClass = isDark ? 'amount-dark' : 'amount-light';
    const bgClass = isDark ? 'bg-dark' : 'bg-white bg-opacity-75';
    const bgAmClass = isDark ? 'bg-light' : 'bg-dark';
    const textClass = isDark ? 'text-light' : 'text-dark';
    const linkClass = isDark ? 'link-light' : 'link-dark';
    const arrowClass = isDark ? 'bg-secondary' : 'bg-light shadow';
    const btnClass = isDark ? 'btn-secondary' : 'btn-light border shadow-sm';
    return { amountClass, bgClass, textClass, bgAmClass, linkClass, arrowClass, btnClass };
  }

  render() {
    const { 
      mode, usdValueIn, usdValueOut, swapInfo, settingsInfo 
    } = this.state;
    const { amountClass, bgClass, textClass, bgAmClass, linkClass, arrowClass, btnClass } = this.css();
    const { tokenIn, tokenOut } = this.tokens();
    const { balanceIn, balanceOut }  = this.balances();
    return (
      <>
        <TokenSelector onTokenSelect={this.onTokenSelect.bind(this)} />
        <Settings settingsInfo={settingsInfo} />
        <Preview swapInfo={swapInfo} />
        <div id="swap" className="row">
          <div className="col-12 col-lg-8 col-xxl-6">
            <div className={`${bgClass} bg-gradient rounded shadow p-3 pt-2`}>
              <div className="pb-4 d-flex justify-content-between align-items-center">
                <div className="fs-1">Swap tokens</div>
                <div className="d-flex align-items-center">
                  {mode === Mode.SwapReady &&
                    <span className={`${textClass} text-opacity-50 d-none d-sm-inline me-3`}>{this.effectivePrice()}</span>
                  }
                  <div id="settings" className="fs-4 me-1" onClick={() => this.openSettings()}>
                    <i className="bi bi-gear"></i>
                  </div>
                </div>
              </div>
              <div className={`d-flex align-items-center ${bgAmClass} bg-opacity-10 rounded px-4 py-2`}>
                <div className="amount-block flex-grow-1">
                  <div className="mb-1">
                    <input id="amount-in" className={amountClass} type="number" autoComplete="off" placeholder="0" min="0" step="any" onChange={() => this.handleAmountChange(IN)} />
                  </div>
                  <div className={`${textClass} text-opacity-75`}>{usd(usdValueIn)}</div>
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
                    <span>Balance : {bnt(balanceIn, 3, ROUND_UP)}</span> {balanceIn?.gt(0) && ( 
                      <>
                        <span className="px-1">·</span> <a href="#" className={linkClass} onClick={(e) => this.handleMaxBalance(e)}>Max</a>
                      </> 
                    )}
                  </div>
                </div>
              </div>
              <div className="separator-line position-relative">
                <div className="progress">
                  <div className="progress-bar" role="progressbar" aria-label="Progress" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <div className={`arrow position-absolute top-0 start-50 translate-middle ${arrowClass} rounded-5 d-none d-sm-flex justify-content-center align-items-center`}>
                  <i className="bi bi-arrow-down"></i>
                </div>
              </div>
              <div className={`d-flex align-items-center ${bgAmClass} bg-opacity-10 rounded px-4 py-2 mb-3`}>
                <div className="amount-block flex-grow-1">
                  <div className="mb-1">
                    <input id="amount-out" className={amountClass} type="number" autoComplete="off" placeholder="0" min="0" step="any" onChange={() => this.handleAmountChange(OUT)} />
                  </div>
                  <div className={`${textClass} text-opacity-75`}>{usd(usdValueOut)}</div>
                </div>
                <div>
                  <div className="select-token d-flex bg-light bg-opacity-10 rounded-5 shadow px-3 py-2 mb-2" onClick={() => this.openTokenSelector(OUT)}>
                    {mode === Mode.Init 
                      ? <span className="fs-5 me-3 text-nowrap">Select <span className="d-none d-sm-inline">token</span></span>
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
                  <div className="text-center small">Balance : {bnt(balanceOut, 3, ROUND_UP)}</div>
                </div>
              </div>
              <div className="d-grid">
              {
                <>
                  {mode === Mode.Init &&
                    <button className={`btn ${btnClass} btn-lg fs-4`} type="button" disabled>Select token</button>
                  }
                  {mode === Mode.TokensSelected &&
                    <button className={`btn ${btnClass} btn-lg fs-4`} type="button" disabled>Enter amount</button>
                  }
                  {mode === Mode.FetchingPrice &&
                    <button className={`btn ${btnClass} btn-lg fs-4`} type="button" disabled>Fetching best price
                      <div className="spinner-border ms-3" style={{width: '1.5rem', height: '1.5rem'}} role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </button>
                  }
                  {mode === Mode.NoRouteFound &&
                    <button className={`btn ${btnClass} btn-lg fs-4`} type="button" disabled>Insufficient liquidity for this trade</button>
                  }
                  {mode === Mode.SwapReady &&
                    <button className={`btn ${btnClass} btn-lg fs-4`} type="button" onClick={() => this.handleSwap()}>Swap</button>
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