import { assert } from 'chai';
import { SwapService } from './swap-service';
import { ETHEREUM_ID } from '../../networks';
import { BalancerHelper } from '../balancer-helper';
import { constants } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';

const TIMEOUT = 1000000;
const { WeiPerEther } = constants;

let balancer, WETH, DAI;

beforeAll(async () => {
    balancer = new BalancerHelper(ETHEREUM_ID);
    WETH = await balancer.findToken('WETH');
    DAI  = await balancer.findToken('DAI');
});

it('findRouteGivenIn', async () => {
    const service = new SwapService(balancer.sdk.swaps);
    const route = await service.findRouteGivenIn(WETH.address, DAI.address, WeiPerEther);
    console.log(`Route given in ${WETH.symbol} -> ${DAI.symbol}`, route);
    console.log('swapAmount', formatUnits(route.swapAmount));
    console.log('Return amount', formatUnits(route.returnAmount));
    assert.isFalse(route.returnAmount.isZero());
}, TIMEOUT);

it('findRouteGivenOut', async () => {
    const service = new SwapService(balancer.sdk.swaps);
    const route = await service.findRouteGivenOut(WETH.address, DAI.address, WeiPerEther.mul(1180));
    console.log(`Route given out ${WETH.symbol} -> ${DAI.symbol}`, route);
    console.log('swapAmount', formatUnits(route.swapAmount));
    console.log('Return amount', formatUnits(route.returnAmount));
    assert.isFalse(route.returnAmount.isZero());
}, TIMEOUT);

// npm run test .\src\protocol\services\swap-service.test.js
// npm run test .\src\protocol\services\swap-service.test.js -- -t 'Find route given in'
