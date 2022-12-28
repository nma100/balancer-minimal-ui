import { assert } from 'chai';
import { SwapService } from './swap-service';
import { GOERLI_ID } from '../../networks';
import { BalancerHelper } from '../balancer-helper';
import { constants } from 'ethers';
import { formatUnits, parseUnits } from 'ethers/lib/utils';
import { BalancerSDK } from '@balancer-labs/sdk';
import { Wallet, providers, BigNumber } from 'ethers';

const INFURA = '';
const TRADER_ADDRESS = ''
const TRADER_KEY = ''

const TIMEOUT = 1000000000;
const { WeiPerEther, MaxUint256 } = constants;

const GAS_PRICE = parseUnits('1', 9);
const MAX_POOLS = 4;
const GOERLI_VAULT = '0xBA12222222228d8Ba445958a75a0704d566BF2C8';

let balancer, WETH, BAL, DAI, RPC_GOERLI;

beforeAll(async () => {
    balancer = new BalancerHelper(GOERLI_ID);
    WETH = await balancer.findToken('WETH');
    BAL  = await balancer.findToken('BAL');
    DAI  = await balancer.findToken('DAI');
    RPC_GOERLI = `https://goerli.infura.io/v3/${INFURA}`;
});

it('Swap', async () => {

    const net = GOERLI_ID, 
        rpc = RPC_GOERLI, 
        tokenIn  = DAI, 
        tokenOut = BAL, 
        swapAmount = WeiPerEther.div(10);

    const sdk = new BalancerSDK({
        network: Number(net),
        rpcUrl: rpc,
        sor: { fetchOnChainBalances: true }
      });

    await sdk.swaps.fetchPools();

    const route = await sdk.swaps.findRouteGivenIn({
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        amount: swapAmount,
        gasPrice: GAS_PRICE,
        maxPools: MAX_POOLS,
    }); 

    console.log(`Route ${tokenIn.symbol} -> ${tokenOut.symbol}`, route);
    console.log('swapAmount', formatUnits(route.swapAmount));
    console.log('Return amount', formatUnits(route.returnAmount));
    assert.isFalse(route.returnAmount.isZero());

    const provider = new providers.JsonRpcProvider(rpc);
    const signer = new Wallet(TRADER_KEY, provider);

    const allowance = await sdk.balancerContracts
            .getErc20(tokenIn.address, signer)
            .allowance(TRADER_ADDRESS, GOERLI_VAULT);

    assert.isTrue(
        allowance.gte(swapAmount), 
        `Insufficient allowance : ${tokenIn.symbol} ${formatUnits(allowance)}`
    );

    const tokenOutContract = sdk.balancerContracts.getErc20(tokenOut.address, signer);
    
    let balance = await tokenOutContract.balanceOf(TRADER_ADDRESS);
    console.log(`${tokenOut.symbol} User balance before :`, formatUnits(balance, tokenOut.decimals));
    
    const oneMinute = BigNumber.from(`${Math.ceil(Date.now() / 1000) + 60}`); 

    const { to, data, value } = sdk.swaps.buildSwap({
        userAddress: signer.address,
        swapInfo: route,
        kind: 0,
        deadline: oneMinute,
        maxSlippage: 50,
    });

    const tx = await signer.sendTransaction({ to, data, value });
    console.log('Transaction ID', tx.hash);
    await tx.wait();
  
    balance = await tokenOutContract.balanceOf(TRADER_ADDRESS);
    console.log(`${tokenOut.symbol} User balance after :`, formatUnits(balance, tokenOut.decimals));

}, TIMEOUT);

it('Allowance', async () => {
    const provider = new providers.JsonRpcProvider(RPC_GOERLI);
    const signer = new Wallet(TRADER_KEY, provider);

    const allowance = await balancer
        .ERC20(DAI.address, signer)
        .allowance(TRADER_ADDRESS, GOERLI_VAULT);

    const isAllowanceOk = allowance.gte(WeiPerEther);

    console.log(formatUnits(allowance), isAllowanceOk);
});

it('Approve', async () => {
    const provider = new providers.JsonRpcProvider(RPC_GOERLI);
    const signer = new Wallet(TRADER_KEY, provider);

    const tx = await balancer
        .ERC20(DAI.address, signer)
        .approve(GOERLI_VAULT, MaxUint256);

    await tx.wait();
}, TIMEOUT);

it('FindRouteGivenIn', async () => {
    const service = new SwapService(balancer.sdk.swaps);
    const route = await service.findRouteGivenIn(WETH.address, DAI.address, WeiPerEther);
    assert.isFalse(route.returnAmount.isZero());
}, TIMEOUT);

// npm run test .\src\protocol\services\swap-service.test.js
// npm run test .\src\protocol\services\swap-service.test.js -- -t 'Swap'
