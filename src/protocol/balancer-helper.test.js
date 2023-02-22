import { BalancerSDK } from '@balancer-labs/sdk';
import { assert } from 'chai';
import { GOERLI_ID, POLYGON_ID, ETHEREUM_ID } from '../networks';
import { bn, bnf } from '../utils/bn';
import { BalancerHelper } from './balancer-helper';

const USER = "0x91F450602455564A64207414c7Fbd1F1F0EbB425";
const TIMEOUT = 100000;

it('Total investments', async () => {
    const balancer = new BalancerHelper(POLYGON_ID);
    const investments = await balancer.totalInvestments(USER);

    assert.isNotNull(investments);
}, TIMEOUT);

it('User boosts', async () => {
    const balancer = new BalancerHelper(GOERLI_ID);
    const boosts = await balancer.userBoosts(USER);

    assert.isNotNull(boosts);
}, TIMEOUT);

it('Token price', async () => {
    const DAI = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
    const balancer = new BalancerHelper(ETHEREUM_ID);
    const oneEthPrice = await balancer.fetchPrice(ETH);
    const tenDaiPrice = await balancer.fetchPrice(DAI, bn(10));
    console.log(bnf(oneEthPrice), bnf(tenDaiPrice));
});

it('Spot price', async () => {

    const INFURA = '';

    const sdk = new BalancerSDK({
        network: 1,
        rpcUrl: `https://mainnet.infura.io/v3/${INFURA}`,
    });

    const DAI = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const BAL = '0xba100000625a3754423978a60c9317c58a424e3d';
    const WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
    const spotPrice = await sdk.pricing.getSpotPrice(DAI, WETH);
    console.log('Spot price', spotPrice);
}, TIMEOUT);

it('Fetch pools', async () => {
    const balancer = new BalancerHelper(ETHEREUM_ID);
    const pools = await balancer.fetchPools();
    pools.slice(0, 5).forEach(pool => console.log(pool.name));
});

it('Apr', async () => {

    const INFURA = '';

    const sdk = new BalancerSDK({
        network: 1,
        rpcUrl: `https://mainnet.infura.io/v3/${INFURA}`,
    });

    const poolId = '0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080';
    const pool = await sdk.pools.find(poolId);
    const apr = await sdk.pools.apr(pool);
    console.log('Apr', pool.name, apr);

}, TIMEOUT);

// npm run test .\src\protocol\balancer-helper.test.js
// npm run test .\src\protocol\balancer-helper.test.js -- -t 'Total investments'
