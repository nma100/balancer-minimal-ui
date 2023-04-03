import { isLinearish } from "@balancer-labs/sdk";
import { bn, ZERO } from "./bn";

export function getBptPrice(pool) {
    if (!pool) return ZERO;
    return bn(pool.totalLiquidity).div(pool.totalShares);
}

export function getBptBalanceFiatValue(pool, balance) {
    return getBptPrice(pool).times(balance);
}

export function getPoolTokens(pool) {
    let poolTokens; 
    if (isLinearish(pool.poolType)) {
        const mainToken = pool.tokens[pool.mainIndex];
        poolTokens = [ mainToken ];
    } else {
        poolTokens = pool.tokens.filter(t => t.address !== pool.address);
    }
    return poolTokens;
}
