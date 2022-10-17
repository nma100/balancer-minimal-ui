import { bnum, ZERO } from "./bnum";

export function getBptPrice(pool) {
    if (!pool) return ZERO;
    return bnum(pool.totalLiquidity).div(pool.totalShares);
}

export function getBptBalanceFiatValue(pool, balance) {
    return bnum(pool.totalLiquidity)
        .div(pool.totalShares)
        .times(balance);
}