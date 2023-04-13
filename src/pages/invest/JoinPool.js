/* eslint-disable jsx-a11y/anchor-is-valid */
import { useContext, useEffect, useState } from "react";
import { useLocation, NavLink, useParams } from "react-router-dom";
import { activeInvestMenu, usd, weight } from "../../utils/page";
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
const PRECISION_3 = 3, PRECISION_5 = 5;

export default function JoinPool() {

    const { account, chainId, balancer, web3Provider, theme } = useContext(OutletContext);
    const { state: poolFromLocation } = useLocation();
    const { poolId: poolFromParamId } = useParams();
    const [ mode, setMode ] = useState(Mode.Init);
    const [ tokens, setTokens ] = useState([]);    
    const [ balances, setBalances ] = useState([]);
    const [ usdValue, setUsdValue ] = useState(ZERO);
    const [ priceImpact, setPriceImpact ] = useState(0);
    const [ insufficientBalance, setInsufficientBalance ] = useState([]);
    const [ tokensToApprove, setTokensToApprove ] = useState([]);
    const [ joinInfo, setJoinInfo ] = useState({ pool: undefined, params: [] });
    const [ joinError, setJoinError ] = useState();
    const [ pool, setPool ] = useState();
    const [ tx, setTx ] = useState();

    useEffect(activeInvestMenu, []);

    useEffect(() => {
        if (poolFromLocation) {
            const tokenList = getPoolTokens(poolFromLocation);
            setTokens(tokenList);
            setPool(poolFromLocation);
            setJoinInfo(info => { info.pool = poolFromLocation; return info; });
        } else { 
            if (balancer) {
                const fetchPoolFromParam = async () => await balancer.findPool(poolFromParamId);
                fetchPoolFromParam().then(poolFromParam => {
                    if (poolFromParam) {
                        const tokenList = getPoolTokens(poolFromParam);
                        setTokens(tokenList);
                        setPool(poolFromParam);
                        setJoinInfo(info => { info.pool = poolFromParam; return info; });
                    }
                });
            }
        }
    }, [poolFromLocation, poolFromParamId, balancer]);

    useEffect(() => {
        const fetchBalances = async () => {
            if (!balancer || !account || !tokens || tokens.length === 0) return;
            const promises = tokens.map(token => balancer.userBalance(account, token));
            const balances = await Promise.all(promises);
            const userBalances = tokens.map((token, index) => {
                return { tokenAddress : token.address, balance: balances[index] };
            });
            setBalances(userBalances);
        }
        fetchBalances();
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
        } else if (insufficientBalances().length > 0) {
            setMode(Mode.InsufficientBalance);
        } else if (!account) {
            setMode(Mode.ConnectWallet);
        } else if ((await findTokensToApprove()).length > 0) {
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

        balancer.joinPool(joinInfo, web3Provider).then(joinTx => {
            setTx(joinTx);
            setMode(Mode.Joining);
            return joinTx.wait();
        })
        .then(() => setMode(Mode.JoinSuccess))
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
        const signer = web3Provider.getSigner();

        console.log('handleApprove', tokensToApprove[0].symbol);

        setMode(Mode.ConfirmTx);

        const tx = await balancer
            .ERC20(tokensToApprove[0].address, signer)
            .approve(vault, constants.MaxUint256);

        setMode(Mode.Approving);
        
        await tx.wait();

        tokensToApprove.shift();
        setTokensToApprove(tokensToApprove);
        setMode(tokensToApprove.length > 0 ? Mode.ApproveTokens : Mode.JoinReady);
    }

    function handleMaxBalance(event, token) {
        event.preventDefault();
        document.getElementById(token.address).value = bnt(balance(token), PRECISION_5, ROUND_DOWN);
        handleAmountChange(token);
    }

    
    function insufficientBalances() {
        let insufficientBalances = [];
        if (balances?.length > 0) {
            for (const {amount, token} of joinInfo.params) {
                const { balance: maxBalance } = balances.find(b => isSameAddress(b.tokenAddress, token.address));
                if (amount.gt(maxBalance)) insufficientBalances.push(token);
            }
        }
        setInsufficientBalance(insufficientBalances);
        return insufficientBalances;

    }

    async function findTokensToApprove() {
        const { vault } = balancer.networkConfig().addresses.contracts;
        let tokensToApproveArray = [];
        for (const { token, amount } of joinInfo.params) {
            const allowance = await balancer.allowance(account, vault, token);
            if (allowance.lt(amount)) tokensToApproveArray.push(token);
        }
        setTokensToApprove(tokensToApproveArray);
        return tokensToApproveArray;
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

    function css() {
        const textClass = isDark(theme) ? 'text-light' : 'text-dark';
        const linkClass = isDark(theme) ? 'link-light' : 'link-dark';
        const successClass = isDark(theme) ? 'success-dark' : 'success-light';
        return { textClass, linkClass, successClass };
    }

    const { textClass, linkClass, successClass } = css();

    return (
        <div id="join-pool" className="row">
            <div className="col-12 col-lg-7 col-xxl-6">
                <div className="bg-dark bg-gradient shadow rounded p-3">

                    <div className="d-flex justify-content-between align-items-center mb-1">
                        <div className="fs-1">Deposit</div>
                        <NavLink className="btn-close btn-close-white" to="/"></NavLink>
                    </div>
                    <div className={`${textClass} text-opacity-75 fs-5 mb-4`}>{pool?.name}</div>
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
                                    <span>Balance : {bnt(balance(token), PRECISION_3, ROUND_UP)}</span> {balance(token)?.gt(0) && ( 
                                        <><span className="px-1">·</span> <a href="#" onClick={(e) => handleMaxBalance(e, token)} className={linkClass}>Max</a></>
                                    )}
                                </div>
                            </div>
                            <div className="amount-block">
                                <input id={token.address} className={`${textClass} text-end`} type="number" autoComplete="off" placeholder="0" min="0" step="any" onChange={debounce(() => handleAmountChange(token), 200)} />
                            </div>
                        </div>
                    )}

                    <div className="d-flex justify-content-between text-light text-opacity-75 mb-4">
                        <div>Total: {usd(usdValue)}</div>
                        {account &&
                            <div>Price impact : {priceImpactFormatted()}</div>
                        }
                    </div>

                    {mode === Mode.Init &&
                        <div className="d-grid">
                            <button type="button" className="btn btn-secondary btn-lg" disabled>Enter amounts</button>
                        </div>
                    }
                    {mode === Mode.InsufficientBalance &&
                        <div className="d-grid">
                            <button type="button" className="btn btn-secondary btn-lg" disabled>Insufficient {insufficientBalance[0]?.symbol} balance</button>
                        </div>
                    }
                    {mode === Mode.ConnectWallet &&
                        <div className="d-grid">
                            <button type="button" className="btn btn-secondary btn-lg" disabled>Connect your wallet</button>
                        </div>
                    }
                    {mode === Mode.ApproveTokens &&
                        <div className="d-grid">
                            <button type="button" className="btn btn-secondary btn-lg" onClick={handleApprove}>Approve {tokensToApprove[0].symbol}</button>
                        </div>
                    }
                    {mode === Mode.Approving &&
                        <div className="d-grid">
                            <button type="button" className="btn btn-secondary btn-lg" disabled>Approving {tokensToApprove[0].symbol} <Spinner /></button>
                        </div>
                    }
                    {mode === Mode.JoinReady &&
                        <div className="d-grid">
                            <button type="button" className="btn btn-secondary btn-lg" onClick={handleAddLiquidity}>Add liquidity</button>
                        </div>
                    }
                    {mode === Mode.Joining &&
                        <div className="d-grid">
                            <button type="button" className="btn btn-secondary btn-lg" disabled>Adding liquidity <Spinner /></button>
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
                            <button type="button" className="btn btn-secondary btn-lg" disabled>Confirmation <Spinner /></button>
                        </div>
                    }
                </div>
            </div>
        </div>
    );
}