import { bn, ZERO } from "./bn";

export function getBptPrice(pool) {
    if (!pool) return ZERO;
    return bn(pool.totalLiquidity).div(pool.totalShares);
}

export function getBptBalanceFiatValue(pool, balance) {
    return getBptPrice(pool).times(balance);
}

export function getLeafTokens(pool) {
    let leafTokens = [];
    for (const poolToken of (pool?.tokens || [])) {
        if (poolToken.address === pool.address) continue;
        if (poolToken.token.pool) {
            leafTokens.push(...getLeafTokens(poolToken.token.pool));
        } else {
            leafTokens.push(poolToken);
        }
    }
    return leafTokens;
}