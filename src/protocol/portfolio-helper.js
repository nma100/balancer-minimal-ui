import { BalancerSDK, POOLS } from "@balancer-labs/sdk";
import { isEthNetwork } from "../networks";
import { getRpcUrl } from "../utils/rpc";
import { getBptBalanceFiatValue } from "../utils/pool";
import { ZERO } from "../utils/bnum";

export class PortfolioHelper {

  constructor(chainId) {
    this.chainId = chainId;
    this.sdk = new BalancerSDK({
      network: Number(chainId),
      rpcUrl: getRpcUrl(chainId)
    });
  }

  async loadStakedPools(account) {

    const { data } = this.sdk;

    const gaugeShares = await data.gaugeShares.query({ where: { user: account.toLowerCase(), balance_gt: "0" } });
    const stakedPoolIds = gaugeShares.map(share => share.gauge.poolId)
    let stakedPools = await data.pools.where(pool => stakedPoolIds.includes(pool.id));

    stakedPools = stakedPools.map(pool => {
      const stakedBpt = gaugeShares.find(gs => gs.gauge.poolId === pool.id);
      return {
        ...pool,
        shares: getBptBalanceFiatValue(pool, stakedBpt.balance),
        bpt: stakedBpt.balance
      };
    });
    // TODO : pool boosts

    const totalStakedAmount = stakedPools
      .map(pool => pool.shares)
      .reduce((total, shares) => total.plus(shares), ZERO);

    return { pools: [...stakedPools], totalFiatAmount: totalStakedAmount }
  }


  async loadUnstakedPools(account) {

    const { data } = this.sdk;

    const poolShares = await data.poolShares.query({ where: { userAddress: account.toLowerCase(), balance_gt: "0" } });

    const poolSharesIds = poolShares.map(poolShare => poolShare.poolId);

    const pools = await data.pools.where(pool => poolSharesIds.includes(pool.id) &&
      !POOLS(this.chainId).ExcludedPoolTypes.includes(pool.poolType));

    // TODO : Phantom pools

    // TODO : Pool decorated. 

    const unstakedPools = pools.map(pool => {
      const stakedBpt = poolShares.find(ps => ps.poolId === pool.id);
      return {
        ...pool,
        shares: getBptBalanceFiatValue(pool, stakedBpt.balance),
        bpt: stakedBpt.balance
      }
    });

    const totalUnstakedAmount = unstakedPools
      .map(pool => pool.shares)
      .reduce((total, shares) => total.plus(shares), ZERO);

    // TODO Filter migratables pools

    return { pools: [...unstakedPools], totalFiatAmount: totalUnstakedAmount }
  }

  async loadVeBalPool(account) {

    if (!isEthNetwork(this.chainId)) return undefined;

    const { data, balancerContracts } = this.sdk;

    const lockPoolId = POOLS(this.chainId).IdsMap.veBAL;
    const lockPool = await data.pools.find(lockPoolId);
    const userLockInfo = await balancerContracts.veBal.getLockInfo(account);

    return {
      ...lockPool,
      shares: userLockInfo?.hasExistingLock
        ? getBptBalanceFiatValue(lockPool, userLockInfo.lockedAmount) : ZERO,
      lockedEndDate: userLockInfo?.hasExistingLock && !userLockInfo?.isExpired
        ? userLockInfo?.lockedEndDate
        : undefined
    };
  }

  async totalInvestments(account) {
    const unstaked = await this.loadUnstakedPools(account);
    const staked = await this.loadStakedPools(account);
    const veBal = await this.loadVeBalPool(account);

    return unstaked.totalFiatAmount
      .plus(staked.totalFiatAmount)
      .plus(veBal?.shares || 0);
  }

}