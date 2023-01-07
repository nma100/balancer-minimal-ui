import React from 'react';
import CryptoIcon from '../../components/CryptoIcon';
import { TokenSelector, SELECT_TOKEN_MODAL } from './TokenSelector';
import { OutletContext } from '../Layout';
import { dollar, openModal } from '../../utils/page';
import { formatUnits, parseUnits } from 'ethers/lib/utils';
import { bnum, bnumf, ONE } from '../../utils/bnum';
import { Preview, PREVIEW_MODAL } from './Preview';
import { debounce } from 'lodash';
import { constants } from 'ethers';
import { Settings, SETTINGS_MODAL } from './Settings';

const IN = 0, OUT = 1;
const DEBOUNCE = 1500;
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
    this.handleAmountChange = debounce(
      this.handleAmountChange.bind(this),
      DEBOUNCE);
  }

  componentDidMount() { 
    this.amountElement(IN).focus();
  }

  openTokenSelector(type) {
    const callBack = () => openModal(SELECT_TOKEN_MODAL);
    this.setState({tokenSelect: type}, callBack);
  }

  onTokenSelect(token) {
    const { mode, tokenSelect } = this.state;
    const callBack = () => { 
      this.updateBalance(tokenSelect);
      this.handleAmountChange(IN);
    }
    if (tokenSelect === IN) {
      this.setState({tokenIn: token}, callBack);
    } else {
      if (mode === Mode.Init) {
        this.setState({mode: Mode.TokensSelected});
      } 
      this.setState({tokenOut: token}, callBack);
    }
  }

  openSettings() {
    const settingsInfo = {
        maxSlippage: this.state.maxSlippage,
        onSave: this.onSaveSettings.bind(this),
    }
    this.setState({settingsInfo}, () => openModal(SETTINGS_MODAL));
  }

  onSaveSettings(settings) {
    const { maxSlippage } = settings;
    this.setState({ maxSlippage});
  }

  async updateUsdValue(kind) {
    const { balancer } = this.context;
    const { tokenIn, tokenOut } = this.tokens();

    const token = kind === IN ? tokenIn : tokenOut;
    const amount = bnum(this.amountElement(kind).value);
   
    const usdValue = await balancer.fetchPrice(token.address, amount);

    if (kind === IN ) {
      this.setState({ usdValueIn:  usdValue })
    } else {
      this.setState({ usdValueOut: usdValue })
    }
  }

  async updateBalance(kind) {
    const { balancer, account, web3Provider } = this.context;
    const { tokenIn, tokenOut } = this.tokens();

    if (!account) return;
    const token = kind === IN ? tokenIn : tokenOut;

    let balance;
    if (token.address === constants.AddressZero) {
      balance = await web3Provider.getBalance(account);
    } else {
      balance = await balancer.ERC20(token.address, web3Provider).balanceOf(account);
    }

    if (kind === IN ) {
      this.setState({ balanceIn:  this.bnum(balance, token.decimals) })
    } else {
      this.setState({ balanceOut: this.bnum(balance, token.decimals) })
    }
  }

  async handleAmountChange(kind) {
    const { mode} = this.state;
    const { tokenIn, tokenOut } = this.tokens();

    this.updateUsdValue(kind);

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
      this.updateUsdValue(kind === IN ? OUT : IN);
    } else {
      if (mode >= Mode.TokensSelected) {
        this.setState({ mode: Mode.FetchPrice });
        const route = await this.findRoute(kind, enteredAmount.value);
        if (route.returnAmount.isZero()) {
          this.setState({ mode: Mode.NoRoute });
          calculatedAmount.value = '';
        } else {
          const priceInfo = this.priceInfo(route, kind, tokenIn, tokenOut)
          this.setState({ mode: Mode.SwapReady, route, kind, priceInfo });
          let calculated;
          if (kind === IN) {
            calculated = this.bnum(route.returnAmount, tokenOut.decimals);
          } else {
            calculated = this.bnum(route.returnAmount, tokenIn.decimals);
          }
          calculatedAmount.value = bnumf(calculated, PRECISION);
        }
        this.updateUsdValue(kind === IN ? OUT : IN);
      }
    }
  }

  handleSwap() {
    const { nativeAsset } = this.context;
    const callback = () => openModal(PREVIEW_MODAL);
    this.setState(state => ({
      swapInfo: {
        tokenIn: state.tokenIn ?? nativeAsset,
        tokenOut: state.tokenOut,
        route: state.route,
        kind:  state.kind,
        priceInfo: state.priceInfo,
        maxSlippage: state.maxSlippage,
      }
    }), callback);
  }

  findRoute(kind, amount) {
    const { balancer } = this.context;
    const { tokenIn, tokenOut } = this.tokens();

    if (kind === IN) {
      const amountIn = parseUnits(amount, tokenIn.decimals);
      return balancer.findRouteGivenIn(tokenIn.address, tokenOut.address, amountIn);
    } else {
      const amountOut = parseUnits(amount, tokenOut.decimals);
      return balancer.findRouteGivenOut(tokenIn.address, tokenOut.address, amountOut);
    }
  }

  tokens() {
    const { nativeAsset } = this.context;
    const { tokenIn, tokenOut } = this.state;
    return { tokenIn: tokenIn ?? nativeAsset, tokenOut };
  }

  amountElement(kind) {
    const suffix = kind === IN  ? 'in' : 'out';
    return document.getElementById(`amount-${suffix}`);
  }

  priceInfo(route, kind, tokenIn, tokenOut) {
    let amountIn, amountOut;
    if (kind === IN) {
      amountIn  = this.bnum(route.swapAmount, tokenIn.decimals);
      amountOut = this.bnum(route.returnAmount, tokenOut.decimals);
    } else {
      amountIn  = this.bnum(route.returnAmount, tokenIn.decimals);
      amountOut = this.bnum(route.swapAmount, tokenOut.decimals);
    }
    const spotPrice = ONE.div(bnum(route.marketSp));
    const effectivePrice = amountOut.div(amountIn);
    const priceImpact = spotPrice.minus(effectivePrice).div(spotPrice).times(100);
    return { 
      spotPrice, effectivePrice, priceImpact, 
      amounts: { amountIn, amountOut }, 
    };
  }

  effectivePrice() {
    const { tokenIn, tokenOut } = this.tokens();
    const { priceInfo: { effectivePrice } } = this.state;
    if (effectivePrice.lt(0.01)) return '';
    return `1 ${tokenIn.symbol} = ${bnumf(effectivePrice)} ${tokenOut.symbol}`;
  }

  bnum(amount, decimals)  {
    const formatted = formatUnits(amount, decimals);
    return bnum(formatted);
  }

  render() {
    const { 
      mode, balanceIn, balanceOut, usdValueIn, 
      usdValueOut, swapInfo, settingsInfo,
    } = this.state;
    const { tokenIn, tokenOut } = this.tokens();
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
                  <div className="select-token d-flex bg-light bg-opacity-10 rounded-5 shadow px-3 py-2 mb-2" onClick={() => this.openTokenSelector(IN)}>
                    <CryptoIcon key={tokenIn.symbol} name={tokenIn.symbol} cssClass="me-3" /> 
                    <span className="fs-5 me-3">{tokenIn.symbol}</span> 
                    <i className="bi bi-chevron-down align-self-center"></i>
                  </div>
                  <div className="text-center small">
                    Balance : {bnumf(balanceIn)} {balanceIn?.gt(0) && <><span className="px-1">·</span> <a href="/" className="link-light">Max</a></>}
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