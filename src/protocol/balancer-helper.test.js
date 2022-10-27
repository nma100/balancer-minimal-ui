import { assert } from 'chai';
import { GOERLI_ID, POLYGON_ID } from '../networks';
import { bnumToStr } from '../utils/bnum';
import { BalancerHelper } from './balancer-helper';

const USER = "0x91F450602455564A64207414c7Fbd1F1F0EbB425";
const TIMEOUT = 100000;

function logPool(pool) {
    const tokens = pool.tokens.map(t => t.symbol);
    const shares = bnumToStr(pool.shares);
    console.log(tokens, shares);
}

it('Load unstaked pools', async () => {
    const balancer = new BalancerHelper(POLYGON_ID);
    const unstaked = await balancer.loadUnstakedPools(USER);

    assert.isNotNull(unstaked.pools);
    unstaked.forEach(logPool);

}, TIMEOUT);

it('Load staked pools', async () => {
    const balancer = new BalancerHelper(POLYGON_ID);
    const staked = await balancer.loadStakedPools(USER);

    assert.isNotNull(staked.pools);
    staked.forEach(logPool);

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

// npm run test .\src\protocol\balancer-helper.test.js 
// npm run test .\src\protocol\balancer-helper.test.js -- -t 'Total investments'
