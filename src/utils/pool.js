import { bn, ZERO } from "./bn";

export function getBptPrice(pool) {
    if (!pool) return ZERO;
    return bn(pool.totalLiquidity).div(pool.totalShares);
}

export function getBptBalanceFiatValue(pool, balance) {
    return getBptPrice(pool).times(balance);
}