import { BalancerSDK, POOLS } from "@balancer-labs/sdk";
import { isEthNetwork } from "../networks";
import { getRpcUrl } from "../utils/rpc";
import { getBptBalanceFiatValue } from "../utils/pool";
import { bnum, ZERO } from "../utils/bnum";

export class BalancerHelper {

  constructor(chainId) {
    this.chainId = chainId;
    this.sdk = new BalancerSDK({
      network: Number(chainId),
      rpcUrl: getRpcUrl(chainId)
      //rpcUrl: 'https://goerli.infura.io/v3/'
    });
  }

  async loadApr(pool) {
    return await this.sdk.pools.apr(pool);
  }

  async loadGaugeShares(account) {
    return await this.sdk.data.gaugeShares.query({ where: { user: account.toLowerCase(), balance_gt: "0" } });

  }

  async loadStakedPools(account) {

    const gaugeShares = await this.loadGaugeShares(account);
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

    const lockPoolId = this.veBalPoolId();
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

  veBalPoolId() {
    return POOLS(this.chainId).IdsMap.veBAL
  } 

  poolsTotal(pools) {
    return pools
      .map(pool => pool.shares)
      .reduce((total, shares) => total.plus(shares), ZERO);
  }

  async userBoosts(account) {

    const { veBal, veBalProxy } = this.sdk.balancerContracts;
    const { liquidityGauges } = this.sdk.data;

    const gaugeShares = await this.loadGaugeShares(account);

    const veBALInfo = await veBal.getLockInfo(account);
    const veBALBalance = await veBalProxy.getAdjustedBalance(account);

    const gaugeAddresses = gaugeShares.map(gaugeShare => gaugeShare.gauge.id);
    const workingSupplies = await liquidityGauges.multicall.getWorkingSupplies(gaugeAddresses);


    const boosts = gaugeShares.map(gaugeShare => {
      const gaugeAddress = gaugeShare.gauge.id;
      const gaugeWorkingSupply = bnum(workingSupplies[gaugeAddress]);
      const gaugeBalance = bnum(gaugeShare.balance);

      const adjustedGaugeBalance = bnum(0.4)
        .times(gaugeBalance)
        .plus(
          bnum(0.6).times(
            bnum(veBALBalance)
              .div(veBALInfo.totalSupply)
              .times(gaugeShare.gauge.totalSupply)
          )
        );


      // choose the minimum of either gauge balance or the adjusted gauge balance
      const workingBalance = gaugeBalance.lt(adjustedGaugeBalance)
        ? gaugeBalance
        : adjustedGaugeBalance;

      const zeroBoostWorkingBalance = bnum(0.4).times(gaugeBalance);
      const zeroBoostWorkingSupply = gaugeWorkingSupply
        .minus(workingBalance)
        .plus(zeroBoostWorkingBalance);

      const boostedFraction = workingBalance.div(gaugeWorkingSupply);
      const unboostedFraction = zeroBoostWorkingBalance.div(
        zeroBoostWorkingSupply
      );

      const boost = boostedFraction.div(unboostedFraction);

      return [gaugeShare.gauge.poolId, boost];
    });

    return Object.fromEntries(boosts);
  }

}