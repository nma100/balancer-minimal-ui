import { assert } from 'chai';
import { POLYGON_ID } from '../networks';
import { bnumToStr } from '../utils/bnum';
import { PortfolioHelper } from './portfolio-helper';

const USER = "0x...";
const TIMEOUT = 100000;

function logPool(pool) {
    const tokens = pool.tokens.map(t => t.symbol);
    const shares = bnumToStr(pool.shares);
    console.log(tokens, shares);
}

it('Load unstaked pools', async () => {
    const portfolio = new PortfolioHelper(POLYGON_ID);
    const unstaked = await portfolio.loadUnstakedPools(USER);

    assert.isNotNull(unstaked.pools);
    unstaked.pools.forEach(logPool);

}, TIMEOUT);

it('Load staked pools', async () => {
    const portfolio = new PortfolioHelper(POLYGON_ID);
    const staked = await portfolio.loadStakedPools(USER);

    assert.isNotNull(staked.pools);
    staked.pools.forEach(logPool);

}, TIMEOUT);

it('Load veBal Pool', async () => {
    const portfolio = new PortfolioHelper(POLYGON_ID);
    const veBal = await portfolio.loadVeBalPool(USER);

    assert.isUndefined(veBal);
}, TIMEOUT);


it('Total investments', async () => {
    const portfolio = new PortfolioHelper(POLYGON_ID);
    const investments = await portfolio.totalInvestments(USER);

    assert.isNotNull(investments);
    console.log('result', bnumToStr(investments));
}, TIMEOUT);

// npm run test .\src\protocol\portfolio-helper.test.js 
// npm run test .\src\protocol\portfolio-helper.test.js -- -t 'Total investments'
