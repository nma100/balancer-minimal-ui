import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { ethers } from "ethers";
import { truncateAddress } from "../utils/page";
import { web3Modal, switchChain } from "../web3-connect";
import { NETWORKS, checkChain, defaultChainId } from "../networks";
import { BalancerHelper } from "../protocol/balancer-helper";
import BalancerUrls from "../protocol/balancer-urls.json";
import { getBptBalanceFiatValue } from "../utils/pool";
import { currentTheme, switchTheme, Theme } from "../theme";
import { ZERO } from "../utils/bnum";

export const OutletContext = React.createContext();

class Layout extends React.Component {
  constructor(props) {
    super(props);
    this.state = { ...this.initState(), theme: currentTheme() };
    this.handleConnect = this.handleConnect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.changeNetwork = this.changeNetwork.bind(this);
    this.toggleTheme = this.toggleTheme.bind(this);
    this.onNetworkChanged = this.onNetworkChanged.bind(this);
    this.onAccountChanged = this.onAccountChanged.bind(this);
  }

  componentDidMount() {
    if (web3Modal.cachedProvider) {
      this.connect()
        .catch(e => console.warn('Reconnect failure', e));
    }
  }

  handleConnect() {
    this.connect()
      .catch(e => console.error('Connect error', e));
  }

  async connect() {
    const provider = await web3Modal.connect();
    const web3Provider = new ethers.providers.Web3Provider(provider);
    const accounts = await web3Provider.listAccounts();
    const network = await web3Provider.getNetwork();
    const chainId = await checkChain(network.chainId, web3Provider);
    provider.on("chainChanged", this.onNetworkChanged);
    provider.on("accountsChanged", this.onAccountChanged);
    const balancer = new BalancerHelper(chainId);
    const state = {
      web3Provider: web3Provider,
      chainId: chainId,
      balancer: balancer,
      account: accounts[0],
    };
    this.setState(state);
    this.loadPortfolio(balancer, accounts[0]);
  }

  async disconnect() {
    web3Modal.clearCachedProvider();
    const state = this.initState();
    this.setState(state);
  }

  async changeNetwork(e) {
    if (!this.state.account) return;
    const chainId = e.target.value;
    const web3Provider = this.state.web3Provider;
    await switchChain(chainId, web3Provider);
  }

  async onNetworkChanged(hexChainId) {
    const { web3Provider, account } = this.state;
    const chainId = await checkChain(Number(hexChainId), web3Provider);
    const provider = await web3Modal.connect();
    const updatedProvider = new ethers.providers.Web3Provider(provider);
    const balancer = new BalancerHelper(chainId);
    provider.on("chainChanged", this.onNetworkChanged);
    provider.on("accountsChanged", this.onAccountChanged);
    this.setState({
      web3Provider: updatedProvider,
      chainId: chainId,
      balancer: balancer,
    });
    this.loadPortfolio(balancer, account);
  }

  async onAccountChanged(accounts) {
    this.setState({ account: accounts[0] });
    this.loadPortfolio(this.state.balancer, accounts[0]);
  }

  toggleTheme() {
    switchTheme();
    window.location.reload()
  }

  loadPortfolio(balancer, account) {
    this.setState({ portfolio: true, ...this.initPools() });

    balancer
      .loadStakedPools(account)
      .then((pools) => {
        this.setState({ stakedPools: pools });
        if (pools.length === 0) {
          this.setState({ stakedAmount: ZERO });
        }
        return pools;
      })
      .then(async (pools) => {
        for (const pool of pools) {
          balancer
            .loadLiquidity(pool)
            .then((liquidity) => {
              pool.totalLiquidity = liquidity;
              pool.shares = getBptBalanceFiatValue(pool, pool.bpt);
            })
            .catch(() => pool.shares = false)
            .finally(() =>
              this.setState({ stakedAmount: balancer.totalAmount(pools) })
            );
        }
      });

    balancer
      .loadUnstakedPools(account)
      .then((pools) => {
        this.setState({ unstakedPools: pools });
        if (pools.length === 0) {
          this.setState({ unstakedAmount: ZERO });
        }
        return pools;
      })
      .then(async (pools) => {
        for (const pool of pools) {
          balancer
            .loadLiquidity(pool)
            .then((liquidity) => {
              pool.totalLiquidity = liquidity;
              pool.shares = getBptBalanceFiatValue(pool, pool.bpt);
            })
            .catch(() => pool.shares = false)
            .finally(() =>
              this.setState({ unstakedAmount: balancer.totalAmount(pools) })
            );
        }
      });
      
    balancer
      .loadVeBalPool(account)
      .then((pool) => {
        this.setState({ veBalPool: pool });
        return pool;
      })
      .then((pool) => {
        this.setState({
          veBalAmount: pool?.shares || ZERO,
        });
      });
  }

  initState() {
    return {
      chainId: defaultChainId(),
      balancer: undefined,
      web3Provider: undefined,
      account: undefined,
      portfolio: undefined,
      ...this.initPools(),
    };
  }

  initPools() {
    return {
      stakedPools: undefined,
      unstakedPools: undefined,
      veBalPool: undefined,
      stakedAmount: undefined,
      unstakedAmount: undefined,
      veBalAmount: undefined,
    };
  }

  render() {
    const { theme } = this.state;
    const isDark = (theme === Theme.Dark);

    const logo = `logo-${theme}.svg`;

    const bodyClass = isDark ? "bg-dark text-light bg-opacity-75": "bg-light text-dark";
    const btnClass = isDark ? "btn btn-dark" : "btn btn-light shadow-sm";
    const btnClassOutline = isDark ? "btn btn-outline-light" : "btn btn-light shadow-sm";
    const hrClass = isDark ? "text-light text-opacity-75" : "";
    const themeIcoClass = isDark ? "bi bi-sun" : "bi bi-moon";
    const navbarClass = isDark
      ? "navbar navbar-dark sticky-top navbar-expand-lg bg-dark bg-gradient shadow py-3 border-bottom border-light border-opacity-25"
      : "navbar sticky-top navbar-expand-lg bg-white bg-gradient shadow py-3";

    document.querySelector("body").className = bodyClass;

    return (
      <>
        <nav className={navbarClass}>
          <div className="container-fluid">
            <a className="navbar-brand d-flex align-items-center" href="/">
              <img
                src={`/image/${logo}`}
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
                      onClick={this.disconnect}
                    >
                      <i className="bi bi-power"></i>
                    </button>
                  </>
                ) : (
                  <button
                    className={`${btnClassOutline} me-2`}
                    type="button"
                    onClick={this.handleConnect}
                  >
                    <i className="bi bi-wallet me-1"></i> Connect wallet
                  </button>
                )}
                <button
                  className={btnClassOutline}
                  onClick={this.toggleTheme}
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
              id={isDark ? "sidebar-container" : "sidebar-container-light"}
              className={`col-lg-2 d-none d-lg-block bg-${
                isDark ? "dark" : "white"
              } shadow`}
            >
              <div id="sidebar-inner" className="py-4 px-3 d-flex flex-column">
                <select
                  className="form-select"
                  onChange={this.changeNetwork}
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
                    className={`link-${isDark ? "light" : "dark"}`}
                  >
                    <i className="bi bi-github"></i>
                  </a>
                  <a
                    href={BalancerUrls.discord}
                    className={`link-${isDark ? "light" : "dark"}`}
                  >
                    <i className="bi bi-discord"></i>
                  </a>
                  <a
                    href={BalancerUrls.twitter}
                    className={`link-${isDark ? "light" : "dark"}`}
                  >
                    <i className="bi bi-twitter"></i>
                  </a>
                  <a
                    href={BalancerUrls.email}
                    className={`link-${isDark ? "light" : "dark"}`}
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
                  onChange={this.changeNetwork}
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
                      onClick={this.disconnect}
                    >
                      <i className="bi bi-power"></i>
                    </button>
                  </>
                ) : (
                  <button
                    className={`${btnClass} text-nowrap me-2`}
                    type="button"
                    onClick={this.handleConnect}
                  >
                    <i className="bi bi-wallet d-none d-sm-inline me-1"></i> Connect wallet
                  </button>
                )}
                <button
                  className={btnClass}
                  onClick={this.toggleTheme}
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
