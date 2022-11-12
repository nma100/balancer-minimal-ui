import { assert } from 'chai';
import { GOERLI_ID, POLYGON_ID, ETHEREUM_ID } from '../networks';
import { bnumf } from '../utils/bnum';
import { BalancerHelper } from './balancer-helper';

const USER = "0x91F450602455564A64207414c7Fbd1F1F0EbB425";
const TIMEOUT = 100000;

it('Load unstaked pools', async () => {
    const balancer = new BalancerHelper(POLYGON_ID);
    const unstaked = await balancer.loadUnstakedPools(USER);

    assert.isNotNull(unstaked.pools);
    unstaked.forEach(logShares);

}, TIMEOUT);

it('Load staked pools', async () => {
    const balancer = new BalancerHelper(POLYGON_ID);
    const staked = await balancer.loadStakedPools(USER);

    assert.isNotNull(staked.pools);
    staked.forEach(logShares);

}, TIMEOUT);

it('Load veBal Pool', async () => {
    const balancer = new BalancerHelper(POLYGON_ID);
    const veBal = await balancer.loadVeBalPool(USER);

    assert.isUndefined(veBal);
}, TIMEOUT);

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


it('Load pools', async () => {
    const POOL_ID1 = '0x2d011adf89f0576c9b722c28269fcb5d50c2d17900020000000000000000024d';
    const POOL_ID2 = '0x4aa462d59361fc0115b3ab7e447627534a8642ae000100000000000000000158';
    const POOL_IDs = [POOL_ID1, POOL_ID2];

    const balancer = new BalancerHelper(ETHEREUM_ID);
    const pools = await balancer.findPools(POOL_IDs);

    assert.isArray(pools);
    assert.equal(pools.length, POOL_IDs.length)
});

it('Load pool', async () => {
    const POOL_ID = '0x2d011adf89f0576c9b722c28269fcb5d50c2d17900020000000000000000024d';

    const balancer = new BalancerHelper(ETHEREUM_ID);
    const pool = await balancer.findPool(POOL_ID);

    assert.isNotNull(pool);
}, TIMEOUT);

it('Load Apr', async () => {
    const POOL_ID = '0x2d011adf89f0576c9b722c28269fcb5d50c2d17900020000000000000000024d';

    const balancer = new BalancerHelper(ETHEREUM_ID);
    const pool = await balancer.findPool(POOL_ID);
    const apr = await balancer.loadApr(pool);

    console.log(apr);

    assert.isNotNull(pool);
}, TIMEOUT);

it('Pref gauge', async () => {
    const POOL_ID = '0x67f8fcb9d3c463da05de1392efdbb2a87f8599ea000200000000000000000059';

    const balancer = new BalancerHelper(GOERLI_ID);
    const pool = await balancer.findPool(POOL_ID);

    const prefGauge = await balancer.findPreferentialGauge(pool.address);

    console.log(pool.address, prefGauge);

    assert.isNotNull(prefGauge);
});

function logShares(pool) {
    const tokens = pool.tokens.map(t => t.symbol);
    const shares = bnumf(pool.shares);
    console.log(tokens, shares);
}

// npm run test .\src\protocol\balancer-helper.test.js
// npm run test .\src\protocol\balancer-helper.test.js -- -t 'Total investments'
