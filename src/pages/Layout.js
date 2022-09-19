import React from 'react';
import { Outlet, NavLink } from "react-router-dom";

class Layout extends React.Component {

    constructor(props) {
      super(props);
      this.state = {
        count: 0
      };
    }
  
    render() {
        return (
            <>
            <nav className="navbar navbar-dark sticky-top navbar-expand-lg bg-dark bg-gradient shadow py-3 border-bottom border-light border-opacity-25">
                <div className="container-fluid">
                    <a className="navbar-brand d-flex align-items-center" href="#">
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
                            <button className="btn btn-outline-light me-2" type="button"><i className="bi bi-wallet me-1"></i> Connect wallet</button>
                            <button className="btn btn-outline-light" type="button"><i className="bi bi-moon-fill"></i></button>
                        </div>
                    </div>
                </div>
            </nav>
            
            <div className="container-fluid">
                <div className="row">
                    <div id="sidebar-container" className="col-lg-2 d-none d-lg-block bg-dark shadow">
                        <div  id="sidebar-inner" className="py-4 px-3 d-flex flex-column">
                            <select className="form-select" aria-label="">
                                <option value="1">Ethereum</option>
                                <option value="2">Polygon</option>
                                <option value="3">Arbitrum</option>
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
                                        <i className="bi bi-arrow-down-up  me-1"></i> Trade
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
                            <select id="select-chain" className="form-select me-auto" aria-label="Select blockchain">
                                <option value="1">Ethereum</option>
                                <option value="2">Polygon</option>
                                <option value="3">Arbitrum</option>
                            </select>   
                            <button className="btn btn-dark text-nowrap me-2" type="button"><i className="bi bi-wallet me-1"></i> 0x9AE4...B425</button>
                            <button className="btn btn-dark" type="button"><i className="bi bi-sun"></i></button>
                        </div>
                        <Outlet />
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum</p>
                    </div>
                </div>
            </div>
            </>
        );
    }
}

export default Layout;