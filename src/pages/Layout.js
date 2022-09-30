import React from 'react';
import { Outlet, NavLink } from "react-router-dom";
import { ethers } from 'ethers';
import { truncateAddress } from "../utils/page";
import { web3Modal, switchChain } from '../web3-connect';
import { NETWORKS, checkChain, defaultChainId } from "../networks";

export const OutletContext = React.createContext();

class Layout extends React.Component {

    constructor(props) {
        super(props);
        this.state = this.initState();
        this.connectWallet = this.connectWallet.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.changeNetwork = this.changeNetwork.bind(this);
        this.onNetworkChanged = this.onNetworkChanged.bind(this);
        this.onAccountChanged = this.onAccountChanged.bind(this);
    }

    async connectWallet() {
        const provider = await web3Modal.connect();
        const library = new ethers.providers.Web3Provider(provider);
        const accounts = await library.listAccounts();
        const network = await library.getNetwork();
        const chainId = await checkChain(network.chainId, library);
        provider.on("chainChanged", this.onNetworkChanged);
        provider.on("accountsChanged", this.onAccountChanged);
        const state = { 
            provider: provider, library: library, 
            chainId: chainId, account: accounts[0] 
        };
        this.setState(state);
    }

    async disconnect() {
        this.state.provider.removeListener("chainChanged", this.onNetworkChanged);
        await web3Modal.clearCachedProvider();
        const state = this.initState();
        this.setState(state);
    }

    async changeNetwork(e) {
        if (!this.state.account) return;
        const chainId = e.target.value;
        await switchChain(chainId, this.state.library);
        this.setState({ chainId: chainId });
    }

    async onNetworkChanged(hexChainId) {
        const chainId = await checkChain(Number(hexChainId), this.state.library);
        this.setState({chainId: chainId});
    }

    onAccountChanged(accounts) {
        this.setState({account: accounts[0]});
    }

    initState() {
        return { provider: undefined, library: undefined, account: undefined, chainId: defaultChainId() };
    }

    render() {
        return (
            <>
            <nav className="navbar navbar-dark sticky-top navbar-expand-lg bg-dark bg-gradient shadow py-3 border-bottom border-light border-opacity-25">
                <div className="container-fluid">
                    <a className="navbar-brand d-flex align-items-center" href="/">
                        <img src="/image/logo-dark.svg" className="me-2" alt="" width="40" height="40" /> <span className="fs-3 fw-semibold pb-1 me-3">Balancer</span> <div id="brand-text" className="navbar-text d-none d-lg-block fs-4">Minimal</div>
                    </a>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav d-flex d-lg-none fs-5 mt-2">
                            <li className="nav-item">
                                <NavLink to="/" className="nav-link" end>Portfolio</NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink to="/trade" className="nav-link">Trade</NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink to="/invest" className="nav-link">Invest</NavLink>
                            </li>
                        </ul>
                        <div className="ms-auto d-none d-lg-block">
                            {this.state.account
                                ? <><button className="btn btn-outline-light text-nowrap me-2" type="button"><i className="bi bi-wallet me-1"></i> {truncateAddress(this.state.account)}</button><button className="btn btn btn-outline-light me-2" type="button" onClick={this.disconnect}><i className="bi bi-power"></i></button></>
                                : <button className="btn btn-outline-light me-2" type="button" onClick={this.connectWallet}><i className="bi bi-wallet me-1"></i> Connect wallet</button>
                            }
                            <button className="btn btn-outline-light" type="button"><i className="bi bi-sun"></i></button>
                        </div>
                    </div>
                </div>
            </nav>
            
            <div className="container-fluid">
                <div className="row">
                    <div id="sidebar-container" className="col-lg-2 d-none d-lg-block bg-dark shadow">
                        <div  id="sidebar-inner" className="py-4 px-3 d-flex flex-column">
                            <select className="form-select" onChange={this.changeNetwork} value={this.state.chainId}>
                                {Object.keys(NETWORKS).map(chainId =>
                                    <option key={chainId} value={chainId}>
                                        {NETWORKS[chainId].name}
                                    </option>
                                )}
                            </select>
                            <hr className="text-light text-opacity-75" />
                            <ul className="nav nav-pills flex-column mb-auto">
                                <li className="nav-item">
                                    <NavLink to="/" className="nav-link" end>
                                        <i className="bi bi-list-task me-1"></i> Portfolio
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/trade"  className="nav-link">
                                        <i className="bi bi-arrow-down-up me-1"></i> Trade
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/invest"  className="nav-link">
                                        <i className="bi bi-cash-stack me-1"></i> Invest
                                    </NavLink>
                                </li>
                            </ul>
                            
                            <hr className="text-light text-opacity-75" />
                            <div className="d-flex justify-content-around fs-5">
                            <a href="/" className="link-light"><i className="bi bi-github"></i></a> 
                            <a href="/" className="link-light"><i className="bi bi-discord"></i></a> 
                            <a href="/" className="link-light"><i className="bi bi-twitter"></i></a> 
                            <a href="/" className="link-light"><i className="bi bi-envelope-fill"></i></a>
                            </div>
                        </div>
                    </div>
                    <div id="main-col" className="col-12 col-lg-10 ms-lg-auto px-4 px-lg-5">
                        <div className="d-flex d-lg-none mt-2 mb-4">
                            <select id="select-chain" className="form-select me-auto" onChange={this.changeNetwork} value={this.state.chainId}>
                                {Object.keys(NETWORKS).map(chainId =>
                                    <option key={chainId} value={chainId}>
                                        {NETWORKS[chainId].name}
                                    </option>
                                )}
                            </select>  
                            {this.state.account
                                ? <><button className="btn btn-dark text-nowrap me-2" type="button"><i className="bi bi-wallet me-1"></i> {truncateAddress(this.state.account)}</button><button className="btn btn-dark me-2" type="button" onClick={this.disconnect}><i className="bi bi-power"></i></button></>
                                : <button className="btn btn-dark text-nowrap me-2" type="button" onClick={this.connectWallet}><i className="bi bi-wallet me-1"></i> Connect wallet</button>
                            } 
                            <button className="btn btn-dark" type="button"><i className="bi bi-sun"></i></button>
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