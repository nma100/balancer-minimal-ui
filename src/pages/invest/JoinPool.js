/* eslint-disable jsx-a11y/anchor-is-valid */
import { useContext, useEffect, useState } from "react";
import { useLocation, NavLink } from "react-router-dom";
import { activeInvestMenu, openModal, usd, weight } from "../../utils/page";
import { getPoolTokens } from "../../utils/pool";
import { OutletContext } from "../Layout";
import CryptoIcon from "../../components/CryptoIcon";
import Spinner from "../../components/Spinner";
import { isDark } from "../../theme";
import { bn, bnt, ROUND_UP, ROUND_DOWN, ZERO } from "../../utils/bn";
import { isSameAddress } from "@balancer-labs/sdk";
import { transactionUrl } from "../../networks";
import { nf } from "../../utils/number";
import { constants } from "ethers";
import { debounce } from "lodash";
import { USER_REJECTED } from "../../web3-connect";
import { SLIPPAGE_MODAL, SlippageSettings } from "../../components/SlippageSettings";

const Mode = {
    Init: 0,
    ConnectWallet: 1,
    ConfirmTx: 2,
    InsufficientBalance: 3,
    ApproveTokens: 4,
    Approving: 5,
    JoinReady: 6,
    Joining: 7,
    JoinSuccess: 8,
    JoinError: 9,
}

const MIN_PI = 0.001;
const MAX_SLIPPAGE = 100;
const PRECISION_3 = 3, PRECISION_6 = 6;

export default function JoinPool() {

    const { account, chainId, balancer, web3Provider, theme } = useContext(OutletContext);
    const { state: pool } = useLocation();
    const [ mode, setMode ] = useState(Mode.Init);
    const [ tokens, setTokens ] = useState([]);    
    const [ balances, setBalances ] = useState([]);
    const [ allowances, setAllowances ] = useState([]);
    const [ usdValue, setUsdValue ] = useState(ZERO);
    const [ priceImpact, setPriceImpact ] = useState(0);
    const [ tokensToApprove, setTokensToApprove ] = useState([]);
    const [ maxSlippage, setMaxSlippage ] = useState(MAX_SLIPPAGE);
    const [ joinInfo, setJoinInfo ] = useState({ pool: undefined, params: [], maxSlippage: MAX_SLIPPAGE });
    const [ joinError, setJoinError ] = useState();
    const [ tx, setTx ] = useState();

    useEffect(activeInvestMenu, []);

    useEffect(() => {
        const tokenList = getPoolTokens(pool);
        setTokens(tokenList);
        setJoinInfo(info => { info.pool = pool; return info; });
    }, [pool]);

    useEffect(() => {
        if (!balancer || !account || !tokens || tokens.length === 0) return;
        const fetchBalances = async () => {
            const promises = tokens.map(token => balancer.userBalance(account, token));
            const balances = await Promise.all(promises);
            const userBalances = tokens.map((token, index) => {
                return { tokenAddress : token.address, balance: balances[index] };
            });
            setBalances(userBalances);
        }
        const fetchAllowances = async () => {
            const { vault } = balancer.networkConfig().addresses.contracts;
            const promises = tokens.map(token => balancer.allowance(account, vault, token));
            const allowances = await Promise.all(promises);
            const vaultAllowances = tokens.map((token, index) => {
                return { tokenAddress : token.address, allowance: allowances[index] };
            });
            setAllowances(vaultAllowances);
        }
        fetchBalances();
        fetchAllowances();
    }, [balancer, account, tokens]);

    async function handleAmountChange(token) {
        const amount = bn(document.getElementById(token.address).value);
        const  { params: joinParams } = joinInfo;

        const index = joinParams.findIndex(param => param.token.address === token.address);

        if (amount.isZero()) {
            if (index !== -1) {
                joinParams.splice(index, 1);
            }
        } else {
            if (index === -1) {
                joinParams.push({ token, amount });
            } else {
                joinParams[index].amount = amount;
            }
        }

        if (joinParams.length === 0) {
            setMode(Mode.Init);    
        } else if (!account) {
            setMode(Mode.ConnectWallet);
        } else if (isTokensWithInsufficientBalance()) {
            setMode(Mode.InsufficientBalance);
        } else if (isTokensWithInsufficientAllowance()) {
            setMode(Mode.ApproveTokens);
        } else {
            setMode(Mode.JoinReady);
        }

        updateUsdValue(joinInfo);
        updatePriceImpact(joinInfo);
    }

    async function updateUsdValue(joinInfo) {
        if (joinInfo.params.length === 0) {
            setUsdValue(ZERO);
            return;
        }
        const promises = []
        joinInfo.params.forEach(({token, amount}) => {
            const promise = balancer.fetchPrice(token.address, amount);
            promises.push(promise);
        });
        const prices = await Promise.all(promises);
        const total = prices.reduce(
            (accumulator, currentValue) => accumulator.plus(currentValue),
            ZERO);
        setUsdValue(total);
    }

    async function updateBalances() {
        const promises = tokens.map(token => balancer.userBalance(account, token));
        const balances = await Promise.all(promises);
        const userBalances = tokens.map((token, index) => {
                return { tokenAddress : token.address, balance: balances[index] };
        });
        setBalances(userBalances);
    }
    
    async function updateAllowances() {
        const { vault } = balancer.networkConfig().addresses.contracts;
        const promises = tokens.map(token => balancer.allowance(account, vault, token));
        const allowances = await Promise.all(promises);
        const vaultAllowances = tokens.map((token, index) => {
            return { tokenAddress : token.address, allowance: allowances[index] };
        });
        setAllowances(vaultAllowances);
    }
    
    async function updatePriceImpact(joinInfo) {
        if (joinInfo.params.length === 0) {
            setPriceImpact(0);
            return;
        }
        if (!web3Provider) return;
        const pi = await balancer.priceImpact(joinInfo, web3Provider, true);
        setPriceImpact(pi);
    }

    function handleAddLiquidity() {
        setMode(Mode.ConfirmTx);

        balancer.joinPool(joinInfo, web3Provider)
            .then(async joinTx => {
                setTx(joinTx);
                setMode(Mode.Joining);
                await joinTx.wait();
                setMode(Mode.JoinSuccess);
                updateBalances();
                updateAllowances();
            })
            .catch(error => {
                if (error.code === USER_REJECTED) {
                    setMode(Mode.JoinReady);
                } else {
                    console.error('Join error', error);
                    setJoinError(error.reason || error);
                    setMode(Mode.JoinError);
                }
            });
    }

    async function handleApprove() {
        const { vault } = balancer.networkConfig().addresses.contracts;
        const { MaxUint256 } = constants;
        const signer = web3Provider.getSigner();

        setMode(Mode.ConfirmTx);
        const tx = await balancer.ERC20(tokensToApprove[0].address, signer).approve(vault, MaxUint256);

        setMode(Mode.Approving);
        await tx.wait();

        updateAllowances();

        tokensToApprove.shift();
        setMode(tokensToApprove.length > 0 ? Mode.ApproveTokens : Mode.JoinReady);
    }

    function handleMaxBalance(event, token) {
        event.preventDefault();
        document.getElementById(token.address).value = bnt(balance(token), PRECISION_6, ROUND_DOWN);
        handleAmountChange(token);
    }
    
    function onSaveSettings(settings) {
        const { maxSlippage } = settings;
        joinInfo.maxSlippage = maxSlippage;
        setMaxSlippage(maxSlippage);
    }

    function isTokensWithInsufficientBalance() {
        if (balances.length === 0) return true;
        const tokens = [];
        for (const {amount, token} of joinInfo.params) {
            const { balance } = balances.find(b => isSameAddress(b.tokenAddress, token.address));
            if (amount.gt(balance)) tokens.push(token);
        }
        return tokens.length > 0;
    }

    function isTokensWithInsufficientAllowance() {
        if (allowances.length === 0) return true;
        const tokens = [];
        for (const { token, amount } of joinInfo.params) {
            const { allowance } = allowances.find(b => isSameAddress(b.tokenAddress, token.address));
            if (allowance.lt(amount)) tokens.push(token);
        }
        setTokensToApprove(tokens);
        return tokens.length > 0;
    }

    function balance(token) {
        const found = balances.find(b => isSameAddress(b.tokenAddress, token.address));
        return found?.balance || ZERO;
    }

    function priceImpactFormatted() {
        if (priceImpact === 0) return `${nf(0, PRECISION_3)}%`
        else if (priceImpact < MIN_PI)  return `< ${nf(MIN_PI, PRECISION_3)}%` 
        else return `${nf(priceImpact, PRECISION_3)}%`;
    }

    function slippageFormatted() {
        return `${nf(maxSlippage / 100)}%`;
    }

    function css() {
        const bgClass = isDark(theme) ? 'bg-dark' : 'bg-white bg-opacity-75';
        const bgAmClass = isDark(theme) ? 'bg-light' : 'bg-dark';
        const textClass = isDark(theme) ? 'text-light' : 'text-dark';
        const textInfoClass = isDark(theme) ? 'text-light text-opacity-75' : 'text-dark text-opacity-75';
        const linkClass = isDark(theme) ? 'link-light' : 'link-dark';
        const successClass = isDark(theme) ? 'success-dark' : 'success-light';
        const btnClass = isDark(theme) ? 'btn-secondary' : 'btn-light border shadow-sm';
        const btnCloseClass = isDark(theme) ? 'btn-close-white' : '';
        return { bgClass, bgAmClass, textClass, textInfoClass, linkClass, successClass, btnClass, btnCloseClass };
    }

    const { bgClass, bgAmClass, textClass, textInfoClass, linkClass, successClass, btnClass, btnCloseClass } = css();

    return (
        <>
            <SlippageSettings settingsInfo={{ maxSlippage: joinInfo.maxSlippage, onSave: onSaveSettings }} />
            <div id="join-pool" className="row">
                <div className="col-12 col-lg-7 col-xxl-6">
                    <div className={`${bgClass} bg-gradient shadow rounded p-3`}>
                        <div className="d-flex align-items-center mb-1">
                            <div className="fs-1 me-auto">Deposit</div>
                            <div id="settings" className="fs-5 me-2" onClick={() => openModal(SLIPPAGE_MODAL)}>
                                <i className="bi bi-gear"></i>
                            </div>
                            <NavLink className={`btn-close ${btnCloseClass}`}  to="/"></NavLink>
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
                                    <div className="text-center text-nowrap small">
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

                        <div className={`d-flex ${textInfoClass}  mb-4`}>
                            <div className="me-auto">Total: {usd(usdValue)}</div>
                            <div>Max. slippage : { slippageFormatted() }</div>
                            {account && (
                                <>
                                    <i className="bi bi-dot mx-2"></i>
                                    <div>Price impact : {priceImpactFormatted()}</div>
                                </>
                            )}
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
                        {mode === Mode.InsufficientBalance &&
                            <div className="d-grid">
                                <button type="button" className={`btn ${btnClass} btn-lg`} disabled>Insufficient balance</button>
                            </div>
                        }
                        {mode === Mode.ApproveTokens &&
                            <div className="d-grid">
                                <button type="button" className={`btn ${btnClass} btn-lg`} onClick={handleApprove}>Approve {tokensToApprove[0]?.symbol}</button>
                            </div>
                        }
                        {mode === Mode.Approving &&
                            <div className="d-grid">
                                <button type="button" className={`btn ${btnClass} btn-lg`} disabled>Approving {tokensToApprove[0]?.symbol} <Spinner /></button>
                            </div>
                        }
                        {mode === Mode.JoinReady &&
                            <div className="d-grid">
                                <button type="button" className={`btn ${btnClass} btn-lg`} onClick={handleAddLiquidity}>Add liquidity</button>
                            </div>
                        }
                        {mode === Mode.Joining &&
                            <div className="d-grid">
                                <button type="button" className={`btn ${btnClass} btn-lg`} disabled>Adding liquidity <Spinner /></button>
                            </div>
                        }
                        {mode === Mode.JoinSuccess &&
                            <div className="text-center mb-2">
                                <div className={`${successClass} fs-4 fw-bold mb-3`}>Success !</div>
                                <a href={transactionUrl(chainId, tx.hash)} className={`${linkClass} text-decoration-none`} target="_blank" rel="noreferrer" >
                                    Transaction <i className="bi bi-box-arrow-up-right"></i>
                                </a>
                            </div>
                        }
                        {mode === Mode.JoinError &&
                            <div className="text-center mb-2">
                                <div className={`text-danger fs-4 fw-bold mb-3`}>Error</div>
                                <div>{joinError?.toString()}</div>
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
        </>
    );
}