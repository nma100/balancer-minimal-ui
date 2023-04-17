/* eslint-disable jsx-a11y/anchor-is-valid */
import { useContext, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import CryptoIcon from "../../components/CryptoIcon";
import Spinner from "../../components/Spinner";
import { transactionUrl } from "../../networks";
import { isDark } from "../../theme";
import { ROUND_DOWN, ROUND_UP, ZERO, bn, bnt, fromEthersBN } from "../../utils/bn";
import { activeInvestMenu, usd, weight } from "../../utils/page";
import { getPoolTokens } from "../../utils/pool";
import { OutletContext } from "../Layout";
import { nf } from "../../utils/number";
import { constants } from "ethers";
import { isSameAddress } from "@balancer-labs/sdk";
import { debounce } from "lodash";
import { USER_REJECTED } from "../../web3-connect";

const Mode = {
    Init: 0,
    ConnectWallet: 1,
    ConfirmTx: 2,
    InsufficientBptBalance: 3,
    ApproveBpt: 4,
    Approving: 5,
    ExitReady: 6,
    Exiting: 7,
    ExitSuccess: 8,
    ExitError: 9,
}

const MIN_PI = 0.001;
const PRECISION_3 = 3, PRECISION_5 = 5;

export default function ExitPool() {

    const { account, chainId, balancer, web3Provider, theme } = useContext(OutletContext);
    const { state: pool } = useLocation();
    const [ mode, setMode ] = useState(Mode.Init);
    const [ tokens, setTokens ] = useState([]);    
    const [ tokensBalances, setTokensBalances ] = useState([]);
    const [ bptBalance, setBptBalance ] = useState(ZERO);
    const [ bptAllowance, setBptAllowance ] = useState(ZERO);
    const [ usdValue, setUsdValue ] = useState(ZERO);
    const [ priceImpact, setPriceImpact ] = useState(0);
    const [ exitInfo, setExitInfo ] = useState({ pool: undefined, params: [] });
    const [ exitError, setExitError ] = useState();
    const [ tx, setTx ] = useState();

    useEffect(() => activeInvestMenu());
    
    useEffect(() => {
        const tokenList = getPoolTokens(pool);
        setTokens(tokenList);
        setExitInfo(info => { info.pool = pool; return info; });
    }, [pool]);

    useEffect(() => {
        if (!balancer || !account || !pool || !tokens || tokens.length === 0) return;
        const fetchBalances = async () => {
            const userPoolBalance = await balancer.userBalance(account, pool);
            const userPoolRatio = userPoolBalance.div(bn(pool.totalShares));
            const userTokensBalances = tokens.map(t => {
                return { tokenAddress: t.address, balance: userPoolRatio.times(bn(t.balance)) };
            });
            setBptBalance(userPoolBalance);
            setTokensBalances(userTokensBalances);
        }
        const fetchAllowance = async () => {
            const { vault } = balancer.networkConfig().addresses.contracts;
            const vaultBptAllowance = await balancer.allowance(account, vault, pool);
            setBptAllowance(vaultBptAllowance);
        }
        fetchBalances();
        fetchAllowance();
    }, [pool, tokens, balancer, account]);

    async function handleAmountChange(token) {
        const amount = bn(document.getElementById(token.address).value);
        const  { params: exitParams } = exitInfo;

        const index = exitParams.findIndex(param => param.token.address === token.address);

        if (amount.isZero()) {
            if (index !== -1) {
                exitParams.splice(index, 1);
            }
        } else {
            if (index === -1) {
                exitParams.push({ token, amount });
            } else {
                exitParams[index].amount = amount;
            }
        }

        if (exitParams.length === 0) {
            setMode(Mode.Init);    
        } else if (!account) {
            setMode(Mode.ConnectWallet);
        } else { 
            const { maxBPTIn } = await balancer.buildExitPoolTx(exitInfo, web3Provider);
            const neededBpt = fromEthersBN(maxBPTIn);
            if (bptBalance.lt(neededBpt)) {
                setMode(Mode.InsufficientBptBalance);
            } else if (bptAllowance.lt(neededBpt)) {
                setMode(Mode.ApproveBpt);
            } else {
                setMode(Mode.ExitReady);
            }
        }

        updateUsdValue(exitInfo);
        updatePriceImpact(exitInfo);
    }
    
    async function updateUsdValue(exitInfo) {
        if (exitInfo.params.length === 0) {
            setUsdValue(ZERO);
            return;
        }
        const promises = []
        exitInfo.params.forEach(({token, amount}) => {
            const promise = balancer.fetchPrice(token.address, amount);
            promises.push(promise);
        });
        const prices = await Promise.all(promises);
        const total = prices.reduce(
            (accumulator, currentValue) => accumulator.plus(currentValue),
            ZERO);
        setUsdValue(total);
    }

    async function updatePriceImpact(exitInfo) {
        if (exitInfo.params.length === 0) {
            setPriceImpact(0);
            return;
        }
        if (!web3Provider) return;
        const pi = await balancer.priceImpact(exitInfo, web3Provider, false);
        setPriceImpact(pi);
    }

    async function updateBalances() {
        const userPoolBalance = await balancer.userBalance(account, pool);
        const userPoolRatio = userPoolBalance.div(bn(pool.totalShares));
        const userTokensBalances = tokens.map(t => {
            return { tokenAddress: t.address, balance: userPoolRatio.times(bn(t.balance)) };
        });
        setBptBalance(userPoolBalance);
        setTokensBalances(userTokensBalances);
    }

    function handleMaxBalance(event, token) {
        event.preventDefault();
        const maxBalance = balance(token);
        document.getElementById(token.address).value = bnt(maxBalance, PRECISION_5, ROUND_DOWN);
        handleAmountChange(token);
    }

    function handleExit() {
        setMode(Mode.ConfirmTx);

        balancer.exitPool(exitInfo, web3Provider)
            .then(async exitTx => {
                setTx(exitTx);
                setMode(Mode.Exiting);
                await exitTx.wait();
                setMode(Mode.ExitSuccess);
                updateBalances();
            })
            .catch(error => {
                if (error.code === USER_REJECTED) {
                    setMode(Mode.ExitReady);
                } else {
                    console.error('Exit error', error);
                    setExitError(error.reason || error);
                    setMode(Mode.ExitError);
                }
            });
    }

    async function handleApproveBpt() {
        const { vault } = balancer.networkConfig().addresses.contracts;
        const { MaxUint256} = constants;
        const signer = web3Provider.getSigner();

        setMode(Mode.ConfirmTx);

        const tx = await balancer
            .ERC20(exitInfo.pool.address, signer)
            .approve(vault, MaxUint256);

        setMode(Mode.Approving);
        await tx.wait();

        setBptAllowance(fromEthersBN(MaxUint256));
        setMode(Mode.ExitReady);
    }

    function css() {
        const bgClass = isDark(theme) ? 'bg-dark' : 'bg-white bg-opacity-75';
        const bgAmClass = isDark(theme) ? 'bg-light' : 'bg-dark';
        const textClass = isDark(theme) ? 'text-light' : 'text-dark';
        const textInfoClass = isDark(theme) ? 'text-light text-opacity-75' : 'text-dark text-opacity-75';
        const linkClass = isDark(theme) ? 'link-light' : 'link-dark';
        const btnClass = isDark(theme) ? 'btn-secondary' : 'btn-light border shadow-sm';
        const btnCloseClass = isDark(theme) ? 'btn-close-white' : '';
        const successClass = isDark(theme) ? 'success-dark' : 'success-light';
        return { bgClass, bgAmClass, textClass, textInfoClass, linkClass, successClass, btnClass, btnCloseClass };
    }

    function priceImpactFormatted() {
        if (priceImpact === 0) return `${nf(0, PRECISION_3)}%`
        else if (priceImpact < MIN_PI)  return `< ${nf(MIN_PI, PRECISION_3)}%` 
        else return `${nf(priceImpact, PRECISION_3)}%`;
    }

    function balance(token) {
        const found = tokensBalances.find(b => isSameAddress(b.tokenAddress, token.address));
        return found?.balance || ZERO;
    }

    const { bgClass, bgAmClass, textClass, textInfoClass, linkClass, successClass, btnClass, btnCloseClass } = css();
    
    return (
        <div id="exit-pool" className="row">
            <div className="col-12 col-lg-7 col-xxl-6">
                <div className={`${bgClass} bg-gradient shadow rounded p-3`}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                        <div className="fs-1">Withdraw</div>
                        <NavLink className={`btn-close ${btnCloseClass}`} to="/"></NavLink>
                    </div>
                    <div className={`${textClass} text-opacity-75 fs-5 mb-4`}>{pool?.name}</div>
                    {tokens.map((token, index) =>
                        <div key={index} className={`d-flex ${bgAmClass} bg-opacity-10 rounded px-4 py-3 mb-3`}>
                            <div>
                                <div className="d-flex bg-light bg-opacity-10 rounded-5 shadow px-3 py-2 mb-3"> 
                                    <CryptoIcon name={token.symbol} cssClass="me-3" />
                                    {token.weight ? (
                                            <>
                                                <span className="fs-5 text-nowrap me-3">{token.symbol}</span> 
                                                <div className={`${textClass} text-opacity-75 align-self-center`}>{weight(token.weight)}</div>
                                            </>
                                        ) : <span className="fs-5 text-nowrap">{token.symbol}</span> 
                                    }
                                </div>
                                <div className="text-center small">
                                    <span>Balance : {bnt(balance(token), PRECISION_3, ROUND_UP)}</span> {balance(token)?.gt(0) && ( 
                                        <><span className="px-1">·</span> <a href="#" onClick={(e) => handleMaxBalance(e, token)} className={linkClass}>Max</a></>
                                    )}
                                </div>
                            </div>
                            <div className="amount-block flex-grow-1">
                                <input id={token.address} className={`${textClass} text-end`} type="number" autoComplete="off" placeholder="0" min="0" step="any" onChange={debounce(() => handleAmountChange(token), 100)} />
                            </div>
                        </div>
                    )}

                    <div className={`d-flex justify-content-between ${textInfoClass} mb-4`}>
                        <div>Total: {usd(usdValue)}</div>
                        {account &&
                            <div>Price impact : {priceImpactFormatted()}</div>
                        }
                    </div>

                    {mode === Mode.Init &&
                        <div className="d-grid">
                            <button type="button" className={`btn ${btnClass} btn-lg`} disabled>Enter amounts</button>
                        </div>
                    }
                    {mode === Mode.ConnectWallet &&
                        <div className="d-grid">
                            <button type="button" className={`btn ${btnClass} btn-lg`} disabled>Connect your wallet</button>
                        </div>
                    }
                    {mode === Mode.InsufficientBptBalance &&
                        <div className="d-grid">
                            <button type="button" className={`btn ${btnClass} btn-lg`} disabled>Insufficient BPT balance</button>
                        </div>
                    }
                    {mode === Mode.ApproveBpt &&
                        <div className="d-grid">
                            <button type="button" className={`btn ${btnClass} btn-lg`} onClick={handleApproveBpt}>Approve BPT</button>
                        </div>
                    }
                    {mode === Mode.Approving &&
                        <div className="d-grid">
                            <button type="button" className={`btn ${btnClass} btn-lg`} disabled>Approving BPT <Spinner /></button>
                        </div>
                    }
                    {mode === Mode.ExitReady &&
                        <div className="d-grid">
                            <button type="button" className={`btn ${btnClass} btn-lg`} onClick={handleExit}>Withdraw liquidity</button>
                        </div>
                    }
                    {mode === Mode.Exiting &&
                        <div className="d-grid">
                            <button type="button" className={`btn ${btnClass} btn-lg`} disabled>Withdrawing <Spinner /></button>
                        </div>
                    }
                    {mode === Mode.ExitSuccess &&
                        <div className="text-center mb-2">
                            <div className={`${successClass} fs-4 fw-bold mb-3`}>Success !</div>
                            <a href={transactionUrl(chainId, tx.hash)} className={`${linkClass} text-decoration-none`} target="_blank" rel="noreferrer" >
                                Transaction <i className="bi bi-box-arrow-up-right"></i>
                            </a>
                        </div>
                    }
                    {mode === Mode.ExitError &&
                        <div className="text-center mb-2">
                            <div className={`text-danger fs-4 fw-bold mb-3`}>Error</div>
                            <pre className="text-danger">{exitError?.toString()}</pre>
                        </div>
                    }
                    {mode === Mode.ConfirmTx &&
                        <div className="d-grid">
                            <button type="button" className={`btn ${btnClass} btn-lg`} disabled>Confirmation <Spinner /></button>
                        </div>
                    }
                </div>
            </div>
        </div>
    );
}