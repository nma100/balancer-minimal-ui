import { bnum, ZERO } from "./bnum-utils";

export function getBptPrice(pool) {
  if (!pool) return ZERO;
  return bnum(pool.totalLiquidity).div(pool.totalShares);
}

export function getBptBalanceFiatValue(pool, balance) {
  return getBptPrice(pool).times(balance).toString();
}
  