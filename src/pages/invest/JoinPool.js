/* eslint-disable jsx-a11y/anchor-is-valid */
import { useContext, useEffect, useState } from "react";
import { useLocation, NavLink } from "react-router-dom";
import { activeInvest, weight } from "../../utils/page";
import { getLeafTokens } from "../../utils/pool";
import { OutletContext } from "../Layout";
import CryptoIcon from "../../components/CryptoIcon";
import { isDark } from "../../theme";
import { bnt, ROUND_UP, ZERO } from "../../utils/bn";

export default function JoinPool() {

    const { theme } = useContext(OutletContext);
    const { state: pool } = useLocation();
    const [ tokens, setTokens ] = useState([]);

    useEffect(() => {
        activeInvest();
        let tokensArray = [];
        getLeafTokens(pool).forEach(async token => {
            //token.userBalance = account ? (await balancer.userBalance(account, token)) : ZERO;
            tokensArray.push(token);
        });
        setTokens(tokensArray);
    }, [ pool ]);


    function handleMaxBalance(tokenId, event) {
        event.preventDefault();
        console.log('handleMaxBalance', tokenId);
    }

    function css() {
        const textClass = isDark(theme) ? 'text-light' : 'text-dark';
        const linkClass = isDark(theme) ? 'link-light' : 'link-dark';
        return { textClass, linkClass };
    }

    const { textClass, linkClass } = css();
    
    return (
        <div id="join-pool" className="row">
            <div className="col-12 col-lg-7 col-xxl-6">
                <div className="bg-dark bg-gradient shadow rounded p-3">

                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="fs-1">Deposit</div>
                        <NavLink className="btn-close btn-close-white" to="/"></NavLink>
                    </div>
                    {tokens.map((token, index) =>
                        <div key={index} className="d-flex justify-content-between bg-light bg-opacity-10 rounded px-4 py-3 mb-3">
                            <div>
                                <div className="d-flex bg-light bg-opacity-10 rounded-5 shadow px-3 py-2 mb-3"> 
                                    <CryptoIcon name={token.symbol} cssClass="me-3" />
                                    {token.weight ? (
                                            <>
                                                <span className="fs-5 me-3">{token.symbol}</span> 
                                                <div className={`${textClass} text-opacity-75 align-self-center`}>{weight(token.weight)}</div>
                                            </>
                                        ) : <span className="fs-5">{token.symbol}</span> 
                                    }
                                </div>
                                <div className="text-center small">
                                    <span>Balance : {bnt(ZERO, 3, ROUND_UP)}</span> <span className="px-1">·</span> <a href="#" onClick={(e) => handleMaxBalance(token.id, e)} className={linkClass}>Max</a>
                                </div>
                            </div>
                            <div className="amount-block">
                                <input id="amount-in" className="amount-dark text-end" type="number" autoComplete="off" placeholder="0" min="0" step="any" />
                            </div>
                        </div>
                    )}

                    <div className="d-flex justify-content-between text-light text-opacity-75 mb-4">
                        <div>Total: $0.00</div>
                        <div>Price impact : 0.02%</div>
                    </div>

                    <div className="d-grid">
                        <button type="button" className="btn btn-secondary btn-lg">Add liquidity</button>
                    </div>

                </div>
            </div>
        </div>
    );
}