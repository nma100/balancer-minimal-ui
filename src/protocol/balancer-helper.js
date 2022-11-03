import {
  BalancerSDK,
  POOLS,
  PoolsSubgraphRepository,
} from "@balancer-labs/sdk";
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
    });
  }

  async loadApr(pool) {
    return await this.sdk.pools.apr(pool);
  }


  async loadGaugeShares(account) {
    const args = {
      where: {
        user: account.toLowerCase(),
        balance_gt: "0"
      }
    };
    return await this.sdk.data.gaugeShares.query(args);
  }

  async loadPoolShares(account) {
    const args = {
      where: {
        userAddress: account.toLowerCase(),
        balance_gt: "0"
      }
    };
    return await this.sdk.data.poolShares.query(args);
  }

  async loadPools(poolIds) {
    const { chainId, urls } = this.sdk.networkConfig;
    const query = {
      args: { where: { 'id': { 'in': poolIds } } }
    };
    const repository = new PoolsSubgraphRepository({
      chainId: chainId,
      url: urls.subgraph,
      query: query,
    });
    return await repository.fetch();
  }

  async loadPool(poolId) {
    return await this.sdk.pools.find(poolId);
  }

  async loadLiquidity(pool) {
    return await this.sdk.pools.liquidity(pool);
  }

  async loadStakedPools(account) {

    const gaugeShares = await this.loadGaugeShares(account);
    const stakedPoolIds = gaugeShares.map(share => share.gauge.poolId)

    let stakedPools = await this.loadPools(stakedPoolIds);
  
    stakedPools = stakedPools.map(pool => {
      const stakedBpt = gaugeShares.find(gs => gs.gauge.poolId === pool.id);
      return {
        ...pool,
        bpt: stakedBpt.balance
      };
    });

    return stakedPools;
  }

  async loadUnstakedPools(account) {

    const poolShares = await this.loadPoolShares(account);
    const unStakedPoolIds = poolShares.map(poolShare => poolShare.poolId);

    let unstakedPools = (await this.loadPools(unStakedPoolIds))
      .filter(pool => !POOLS(this.chainId).ExcludedPoolTypes.includes(pool.poolType));

    unstakedPools = unstakedPools.map(pool => {
      const stakedBpt = poolShares.find(ps => ps.poolId === pool.id);
      return {
        ...pool,
        bpt: stakedBpt.balance
      }
    });

    return unstakedPools;
  }

  async loadVeBalPool(account) {

    if (!isEthNetwork(this.chainId)) return undefined;

    const { balancerContracts } = this.sdk;

    const lockPoolId = this.veBalPoolId();
    const lockPool = await this.loadPool(lockPoolId);

    lockPool.totalLiquidity = await this.loadLiquidity(lockPool);

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