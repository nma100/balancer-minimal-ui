import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { ethers } from "ethers";
import { truncateAddress } from "../utils/page";
import { web3Modal, switchChain } from "../web3-connect";
import { NETWORKS, checkChain, defaultChainId, nativeAsset } from "../networks";
import { BalancerHelper } from "../protocol/balancer-helper";
import BalancerUrls from "../protocol/resources/balancer-urls.json";
import { currentTheme, switchTheme, isDark } from "../theme";

export const OutletContext = React.createContext();

class Layout extends React.Component {

  constructor(props) {
    super(props);
    this.state = { ...this.initState(), theme: currentTheme() };
  }

  componentDidMount() {
    if (web3Modal.cachedProvider) {
      this.connect()
        .catch(e => console.warn('Reconnect failure', e));
    }
    document.querySelector('body').className = this.css().bodyClass;
  }

  handleConnect() {
    this.connect()
      .catch(e => console.error('Connect error', e));
  }

  handleDisconnect() {
    web3Modal.clearCachedProvider();
    const state = this.initState();
    this.setState(state);
  }

  handleChangeNetwork(e) {
    if (!this.state.account) return;
    const chainId = e.target.value;
    const web3Provider = this.state.web3Provider;
    switchChain(chainId, web3Provider);
  }

  handleToggleTheme() {
    switchTheme();
    window.location.reload()
  }

  onNetworkChanged() {
    this.connect();
  }

  onAccountChanged(accounts) {
    const { balancer } = this.state;
    balancer.loadPortfolio(accounts[0], this.setState.bind(this));
  }

  async connect() {
    const provider = await web3Modal.connect();
    const web3Provider = new ethers.providers.Web3Provider(provider);
    const network = await web3Provider.getNetwork();
    const account = (await web3Provider.listAccounts())[0];
    const chainId = await checkChain(network.chainId, web3Provider);
    const balancer = new BalancerHelper(chainId);
    const asset = nativeAsset(chainId);
    /*const asset = { 
      coin: nativeAsset(chainId),
      balance: await web3Provider.getBalance(account),
    };*/
    provider.on('chainChanged', e => this.onNetworkChanged(e));
    provider.on('accountsChanged', e => this.onAccountChanged(e));
    const state = {
      web3Provider: web3Provider,
      chainId: chainId,
      nativeAsset: asset,
      balancer: balancer,
      account: account,
    };
    this.setState(state);
    balancer.loadPortfolio(account, this.setState.bind(this));
  }

  initState() {
    const chainId = defaultChainId();
    const asset = nativeAsset(chainId);
    const balancer = new BalancerHelper(chainId);
    return {
      chainId: chainId,
      nativeAsset: asset,
      balancer: balancer,
      web3Provider: undefined,
      account: undefined,
      portfolio: undefined,
      stakedPools: undefined,
      unstakedPools: undefined,
      veBalPool: undefined,
      stakedAmount: undefined,
      unstakedAmount: undefined,
      veBalAmount: undefined,
    };
  }

  css() {
    const { theme } = this.state;

    const bodyClass = isDark(theme) ? [ 'bg-dark', 'text-light', 'bg-opacity-75' ] : [ 'bg-light',  'text-dark' ];
    const hrClass = isDark(theme) ? [ 'text-light', 'text-opacity-75' ] : [];
    const btnClass = [ 'btn' ].concat(isDark(theme) ? [ 'btn-dark' ] : [ 'btn-light', 'shadow-sm' ]);
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
                  <NavLink to="/" className="nav-link" end>
                    Portfolio
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/trade" className="nav-link">
                    Trade
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/invest" className="nav-link">
                    Invest
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
                <select
                  className="form-select"
                  onChange={e => this.handleChangeNetwork(e)}
                  value={this.state.chainId}
                >
                  {Object.keys(NETWORKS).map((chainId) => (
                    <option key={chainId} value={chainId}>
                      {NETWORKS[chainId].name}
                    </option>
                  ))}
                </select>
                <hr className={hrClass} />
                <ul className="nav nav-pills flex-column mb-auto">
                  <li className="nav-item">
                    <NavLink to="/" className="nav-link" end>
                      <i className="bi bi-list-task me-1"></i> Portfolio
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink to="/trade" className="nav-link">
                      <i className="bi bi-arrow-down-up me-1"></i> Trade
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink to="/invest" className="nav-link">
                      <i className="bi bi-cash-stack me-1"></i> Invest
                    </NavLink>
                  </li>
                </ul>

                <hr className={hrClass} />
                <div className="d-flex justify-content-around fs-5">
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
