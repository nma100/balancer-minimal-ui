import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { blur, openModal, reload, truncateAddress } from "../utils/page";
import { web3Modal, switchChain, web3Account } from "../web3-connect";
import { ETHEREUM_ID, NETWORKS, checkChain, nativeAsset } from "../networks";
import { BalancerHelper } from "../protocol/balancer-helper";
import BalancerUrls from "../protocol/resources/balancer-urls.json";
import { currentTheme, switchTheme, isDark } from "../theme";
import { fromEthersBN, ZERO } from "../utils/bn";
import { ethers } from "ethers";
import { NetworkSelector, SELECT_NETWORK_MODAL } from "../components/NetworkSelector";

const RELOAD_CHAIN = 'reload-chain';
export const POOLS_PER_PAGE = 10;

export const OutletContext = React.createContext();

class Layout extends React.Component {

  constructor(props) {
    super(props);
    this.state = { theme: currentTheme() };
  }

  componentDidMount() {
    this.reconnect();
    document.querySelector('body')
      .className = this.css().bodyClass;
  }

  async reconnect() {
    const state = this.setState.bind(this);
    const chainId = this.getChainToReload();
    const nativeCoin = this.coin(chainId);
    const balancer = new BalancerHelper(chainId);
    const pools = await balancer.fetchPools(POOLS_PER_PAGE);
    state({ chainId, nativeCoin, balancer, pools });

    if (web3Modal.cachedProvider) {
      this.web3Connect()
        .then(({ balancer, account }) => balancer.loadPortfolio(account, state))
        .catch(e => console.warn('Reconnect failure', e));
    }
  }

  handleConnect() {
    this.web3Connect()
      .then(() => { blur(); reload(); })
      .catch(e => console.error('Connect error', e));
  }

  handleDisconnect() {
    web3Modal.clearCachedProvider();
    sessionStorage.clear();
    reload();
  }

  handleChangeNetwork(e) {
    const chainId = e.target.value;
    this.processChangeNetwork(chainId);
  }

  handleToggleTheme() {
    switchTheme();
    reload();
  }

  openNetworkSelector() {
    openModal(SELECT_NETWORK_MODAL);
  }

  onNetworkSelect(chainId) {
    this.processChangeNetwork(chainId);
  }
  
  processChangeNetwork(chainId) {
    sessionStorage.clear();
    if (this.state.account) {
      const { web3Provider } = this.state;
      switchChain(chainId, web3Provider);
    } else {
      this.setChainToReload(chainId);
    }
  }

  setChainToReload(chainId) {
    localStorage.setItem(RELOAD_CHAIN, chainId);
    reload();
  }

  getChainToReload() {
    return localStorage.getItem(RELOAD_CHAIN) || ETHEREUM_ID;
  }

  async web3Connect() {
    const provider = await web3Modal.connect();
    provider.on('chainChanged', reload);
    provider.on('accountsChanged', reload);
    const web3Provider = new ethers.providers.Web3Provider(provider);
    const network = await web3Provider.getNetwork();
    const account = await web3Account(web3Provider);
    const chainId = await checkChain(network.chainId, web3Provider);
    const nativeCoin = await this.coinWithBalance(chainId, web3Provider);
    const balancer = new BalancerHelper(chainId);
    const pools = await balancer.fetchPools()
    this.setState({ web3Provider, account, chainId, nativeCoin, balancer, pools });
    return { balancer, account };
  }

  async coinWithBalance(chainId, web3Provider) {
    if (!web3Provider) return this.coin(chainId);
    const account = await web3Account(web3Provider);
    const balance = await web3Provider.getBalance(account);
    return { 
      coin: nativeAsset(chainId),
      balance: fromEthersBN(balance),
    };
  }

  coin(chainId) {
    return {
      coin: nativeAsset(chainId),
      balance: ZERO,
    };
  }

  css() {
    const { theme } = this.state;
    const bodyClass = isDark(theme) ? [ 'bg-dark', 'text-light', 'bg-opacity-75' ] : [ 'bg-light',  'text-dark' ];
    const hrClass = isDark(theme) ? [ 'text-white', 'text-opacity-75' ] : [];
    const btnClass = [ 'btn' ].concat(isDark(theme) ? [ 'btn-dark' ] : [ 'btn-light', 'border', 'shadow-sm' ]);
    const btnClassOutline = [ 'btn' ].concat(isDark(theme) ? [ 'btn-outline-light' ] : [ 'btn-light', 'shadow-sm' ]);
    const themeIcoClass = [ 'bi' ].concat(isDark(theme) ?  [ 'bi-sun' ] : [ 'bi-moon' ]);
    const navbarClass = [ 'navbar', 'navbar-expand-lg', 'sticky-top', 'bg-gradient', 'shadow', 'py-3' ]
      .concat(isDark(theme) ? [ 'bg-dark', 'navbar-dark', 'border-bottom', 'border-light', 'border-opacity-25' ] : [ 'bg-white' ]);

    const classes = { bodyClass, btnClass, btnClassOutline, hrClass, themeIcoClass, navbarClass };
    Object.keys(classes).forEach(key => classes[key] = classes[key].join(' '));
    return classes;
  }

  render() {
    const { theme } = this.state;
    const {
      btnClass, btnClassOutline, hrClass, themeIcoClass, navbarClass,
    } = this.css();
    
    return (
      <>
        <NetworkSelector onNetworkSelect={this.onNetworkSelect.bind(this)} theme={this.state.theme} />
        <nav className={navbarClass}>
          <div className="container-fluid">
            <a className="navbar-brand d-flex align-items-center" href="/">
              <img
                src={`/image/logo-${theme}.svg`}
                className="me-2"
                alt=""
                width="40"
                height="40"
              />
              <span className="fs-3 fw-semibold pb-1 me-3">Balancer</span>
              <div
                id="brand-text"
                className="navbar-text d-none d-lg-block fs-4"
              >
                Minimal
              </div>
            </a>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarSupportedContent"
              aria-controls="navbarSupportedContent"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div
              className="collapse navbar-collapse"
              id="navbarSupportedContent"
            >
              <ul className="navbar-nav d-flex d-lg-none fs-5 mt-2">
                <li className="nav-item">
                  <NavLink to="/" className="nav-link invest" end>
                    Invest
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/trade" className="nav-link">
                    Trade
                  </NavLink>
                </li>                
                <li className="nav-item">
                  <NavLink to="/portfolio" className="nav-link">
                    Portfolio
                  </NavLink>
                </li>
              </ul>
              <div className="ms-auto d-none d-lg-block">
                {this.state.account ? (
                  <>
                    <button
                      className={`${btnClassOutline} text-nowrap me-2`}
                      type="button"
                    >
                      <i className={`bi bi-wallet me-1`}></i>{" "}
                      {truncateAddress(this.state.account)}
                    </button>
                    <button
                      className={`${btnClassOutline} me-2`}
                      type="button"
                      onClick={e => this.handleDisconnect(e)}
                    >
                      <i className="bi bi-power"></i>
                    </button>
                  </>
                ) : (
                  <button
                    className={`${btnClassOutline} me-2`}
                    type="button"
                    onClick={e => this.handleConnect(e)}
                  >
                    <i className="bi bi-wallet me-1"></i> Connect wallet
                  </button>
                )}
                <button
                  className={btnClassOutline}
                  onClick={e => this.handleToggleTheme(e)}
                  type="button"
                >
                  <i className={themeIcoClass}></i>
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="container-fluid">
          <div className="row">
            <div
              id={isDark(theme) ? "sidebar-container" : "sidebar-container-light"}
              className={`col-lg-2 d-none d-lg-block bg-${
                isDark(theme) ? "dark" : "white"
              } shadow`}
            >
              <div id="sidebar-inner" className="py-4 px-3 d-flex flex-column">
                {!this.state.chainId &&
                  <button id="network-select" type="button" className="btn btn-outline-light btn-lg">
                    <div className="d-flex">
                      <div className="placeholder-glow flex-grow-1">
                          <span className="placeholder network"></span>
                      </div>
                      <div className="chevron"><i className="bi bi-chevron-down"></i></div>
                    </div>
                  </button>
                }
                {this.state.chainId &&
                  <button id="network-select" type="button" className="btn btn-outline-light btn-lg" onClick={e => this.openNetworkSelector(e)}>
                    <div className="d-flex">
                      <img className="icon" src={`/image/network/${NETWORKS[this.state.chainId].name}.svg`} alt="network"/> 
                      <div className="flex-grow-1">{NETWORKS[this.state.chainId].name}</div>
                      <div className="chevron"><i className="bi bi-chevron-down"></i></div>
                    </div>
                  </button>
                }
                <hr className={`${hrClass} my-4`} />
                <ul className="nav nav-pills flex-column mb-auto">
                  <li className="nav-item">
                    <NavLink to="/" className="nav-link invest" end>
                      <i className="bi bi-stars me-2"></i> Invest
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink to="/trade" className="nav-link">
                      <i className="bi bi-arrow-down-up me-2"></i> Trade
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink to="/portfolio" className="nav-link">
                      <i className="bi bi-list-task me-2"></i> Portfolio
                    </NavLink>
                  </li>
                </ul>

                <hr className={hrClass} />
                <div className="d-flex justify-content-around fs-4">
                  <a
                    href={BalancerUrls.github}
                    className={`link-${isDark(theme) ? "light" : "dark"}`}
                  >
                    <i className="bi bi-github"></i>
                  </a>
                  <a
                    href={BalancerUrls.discord}
                    className={`link-${isDark(theme) ? "light" : "dark"}`}
                  >
                    <i className="bi bi-discord"></i>
                  </a>
                  <a
                    href={BalancerUrls.twitter}
                    className={`link-${isDark(theme) ? "light" : "dark"}`}
                  >
                    <i className="bi bi-twitter"></i>
                  </a>
                  <a
                    href={BalancerUrls.email}
                    className={`link-${isDark(theme) ? "light" : "dark"}`}
                  >
                    <i className="bi bi-envelope-fill"></i>
                  </a>
                </div>
              </div>
            </div>
            <div
              id="main-col"
              className="col-12 col-lg-10 ms-lg-auto px-4 px-lg-5"
            >
              <div className="d-flex d-lg-none mt-2 mb-4">
                <select
                  id="select-chain"
                  className="form-select me-auto"
                  onChange={e => this.handleChangeNetwork(e)}
                  value={this.state.chainId}
                >
                  {Object.keys(NETWORKS).map((chainId) => (
                    <option key={chainId} value={chainId}>
                      {NETWORKS[chainId].name}
                    </option>
                  ))}
                </select>
                {this.state.account ? (
                  <>
                    <button
                      className={`${btnClass} text-nowrap me-2`}
                      type="button"
                    >
                      <i className="bi bi-wallet d-none d-sm-inline me-1"></i>{" "}
                      {truncateAddress(this.state.account)}
                    </button>
                    <button
                      className={`${btnClass} me-2`}
                      type="button"
                      onClick={e => this.handleDisconnect(e)}
                    >
                      <i className="bi bi-power"></i>
                    </button>
                  </>
                ) : (
                  <button
                    className={`${btnClass} text-nowrap me-2`}
                    type="button"
                    onClick={e => this.handleConnect(e)}
                  >
                    <i className="bi bi-wallet d-none d-sm-inline me-1"></i> Connect wallet
                  </button>
                )}
                <button
                  className={btnClass}
                  onClick={e => this.handleToggleTheme(e)}
                  type="button"
                >
                  <i className={themeIcoClass}></i>
                </button>
              </div>
              <OutletContext.Provider value={this.state}>
                <Outlet />
              </OutletContext.Provider>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default Layout;
