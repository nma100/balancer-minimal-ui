import { BalancerSDK, POOLS } from "@balancer-labs/sdk";
import { isEthNetwork } from "../networks";
import { getRpcUrl } from "../utils/rpc";
import { getBptBalanceFiatValue } from "../utils/pool";
import { ZERO } from "../utils/bnum";

export class BalancerHelper {

  constructor(chainId) {
    this.chainId = chainId;
    this.sdk = new BalancerSDK({
      network: Number(chainId),
      rpcUrl: getRpcUrl(chainId)
    });
  }

  async loadApr(pool) {
    return await this.sdk.pools.apr(pool);
  }

  async loadStakedPools(account) {

    const gaugeShares = await this.sdk.data.gaugeShares.query({ where: { user: account.toLowerCase(), balance_gt: "0" } });
    const stakedPoolIds = gaugeShares.map(share => share.gauge.poolId)
    let stakedPools = await this.sdk.pools.where(pool => stakedPoolIds.includes(pool.id));

    for (let i = 0; i < stakedPools.length; i++) {
      stakedPools[i].totalLiquidity = await this.sdk.pools.liquidity(stakedPools[i]);
    }

    stakedPools = stakedPools.map(pool => {
      const stakedBpt = gaugeShares.find(gs => gs.gauge.poolId === pool.id);
      return {
        ...pool,
        shares: getBptBalanceFiatValue(pool, stakedBpt.balance),
        bpt: stakedBpt.balance
      };
    });
    // TODO : pool boosts

    return stakedPools;
  }

  async loadUnstakedPools(account) {

    const poolShares = await this.sdk.data.poolShares.query({ where: { userAddress: account.toLowerCase(), balance_gt: "0" } });
    const poolSharesIds = poolShares.map(poolShare => poolShare.poolId);
    let unstakedPools = await this.sdk.pools.where(pool => poolSharesIds.includes(pool.id) &&
      !POOLS(this.chainId).ExcludedPoolTypes.includes(pool.poolType));

    // TODO : Phantom poo
    // TODO : Pool decorated.

    for (let i = 0; i < unstakedPools.length; i++) {
      unstakedPools[i].totalLiquidity = await this.sdk.pools.liquidity(unstakedPools[i]);
    }

    unstakedPools = unstakedPools.map(pool => {
      const stakedBpt = poolShares.find(ps => ps.poolId === pool.id);
      return {
        ...pool,
        shares: getBptBalanceFiatValue(pool, stakedBpt.balance),
        bpt: stakedBpt.balance
      }
    });
    // TODO Filter migratables pools

    return unstakedPools;
  }

  async loadVeBalPool(account) {

    if (!isEthNetwork(this.chainId)) return undefined;

    const { data, balancerContracts } = this.sdk;

    const lockPoolId = POOLS(this.chainId).IdsMap.veBAL;
    const lockPool = await data.pools.find(lockPoolId);
    lockPool.totalLiquidity = await this.sdk.pools.liquidity(lockPool);

    const userLockInfo = await balancerContracts.veBal.getLockInfo(account);

    return {
      ...lockPool,
      shares: userLockInfo?.hasExistingLock
        ? getBptBalanceFiatValue(lockPool, userLockInfo.lockedAmount) : ZERO,
      lockedEndDate: userLockInfo?.hasExistingLock && !userLockInfo.isExpired
        ? userLockInfo.lockedEndDate
        : undefined
    };
  }

  poolsTotal(pools) {
    return pools
      .map(pool => pool.shares)
      .reduce((total, shares) => total.plus(shares), ZERO);
  }

}