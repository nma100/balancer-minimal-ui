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
    console.log('BalancerHelper constructeur');
    this.chainId = chainId;
    this.sdk = new BalancerSDK({
      network: Number(chainId),
      rpcUrl: getRpcUrl(chainId),
    });
    this.cacheLiquidity = {};
    this.cacheApr = {};
  }

  async loadApr(pool) {
    if (!this.cacheApr[pool.id]) {
      //console.log('loadApr NO CACHED', pool.name);
      this.cacheApr[pool.id] = this.sdk.pools.apr(pool);
    } else {
      //console.log('loadApr CACHED', pool.name);
    }
    const apr = await this.cacheApr[pool.id];
    this.checkApr(pool, apr);
    return apr;
  }

  checkApr(pool, apr) {
    const isValid = (n) => isFinite(n) && !isNaN(n);
    let err = false;
    if (!apr) 
      err = `falsy apr = ${apr}`;
    if (!isValid(apr.min)) 
      err = `apr.min = ${apr.min}`;
    if (!isValid(apr.max)) 
      err = `apr.max = ${apr.max}`;
    if (!isValid(apr.swapFees)) 
      err = `apr.swapFees = ${apr.swapFees}`;
    if (!isValid(apr.protocolApr)) 
      err = `apr.protocolApr = ${apr.protocolApr}`;
    if (!isValid(apr.tokenAprs.total))
      err = `apr.tokenAprs.total = ${apr.tokenAprs.total}`;
    if (!isValid(apr.stakingApr.min))
      err = `apr.stakingApr.min = ${apr.stakingApr.min}`;
    if (!isValid(apr.stakingApr.max))
      err = `apr.stakingApr.max = ${apr.stakingApr.max}`;
    if (!isValid(apr.rewardAprs.total))
      err = `apr.rewardAprs.total = ${apr.rewardAprs.total}`;
    if (err !== false) {
      const msg = `Invalid APR (${pool.name}) : ${err}`;
      console.error(msg, apr);
      throw new Error(msg);
    }
  }

  async loadLiquidity(pool) {
    if (!this.cacheLiquidity[pool.id]) {
      this.cacheLiquidity[pool.id] = this.sdk.pools.liquidity(pool);
    }
    const liquidity = await this.cacheLiquidity[pool.id];
    this.checkLiquidity(pool, liquidity);
    return liquidity;
  }

  checkLiquidity(pool, liquidity) {
    const bn = bnum(liquidity);
    if (bn.isNaN() || !bn.isFinite() || bn.isZero()) {
      const msg = `Invalid liquidity (${pool.name}) : ${liquidity}`;
      console.error(msg);
      throw new Error(msg);
    }
  }

  async loadGaugeShares(account) {
    const args = {
      where: {
        user: account.toLowerCase(),
        balance_gt: "0",
      },
    };
    return await this.sdk.data.gaugeShares.query(args);
  }

  async loadPoolShares(account) {
    const args = {
      where: {
        userAddress: account.toLowerCase(),
        balance_gt: "0",
      },
    };
    return await this.sdk.data.poolShares.query(args);
  }

  async findPools(poolIds) {
    const { chainId, urls } = this.sdk.networkConfig;
    const query = {
      args: { where: { id: { in: poolIds } } },
    };
    const repository = new PoolsSubgraphRepository({
      chainId: chainId,
      url: urls.subgraph,
      query: query,
    });
    return await repository.fetch();
  }

  async findPool(poolId) {
    return await this.sdk.pools.find(poolId);
  }

  
  async findPreferentialGauge(pool) {
    const result = await this.sdk.data.poolGauges.find(pool.address);

    let gauge = undefined;
    if (result) {
      console.log('All gauges of this pool', result);
      if (result.gauges.length === 1) {
        gauge = result.gauges[0].id;
      } else {
        gauge = result.preferentialGauge.id;
      }
    }
    console.log('Preferential gauge', gauge);
    return gauge;
  }

  async loadStakedPools(account) {
    const gaugeShares = await this.loadGaugeShares(account);
    const stakedPoolIds = gaugeShares.map((share) => share.gauge.poolId);

    let stakedPools = await this.findPools(stakedPoolIds);

    stakedPools = stakedPools.map((pool) => {
      const stakedBpt = gaugeShares.find((gs) => gs.gauge.poolId === pool.id);
      return {
        ...pool,
        bpt: stakedBpt.balance,
      };
    });

    return stakedPools;
  }

  async loadUnstakedPools(account) {
    const poolShares = await this.loadPoolShares(account);
    const unStakedPoolIds = poolShares.map((poolShare) => poolShare.poolId);

    let unstakedPools = (await this.findPools(unStakedPoolIds)).filter(
      (pool) => !POOLS(this.chainId).ExcludedPoolTypes.includes(pool.poolType)
    );

    unstakedPools = unstakedPools.map((pool) => {
      const stakedBpt = poolShares.find((ps) => ps.poolId === pool.id);
      return {
        ...pool,
        bpt: stakedBpt.balance,
      };
    });

    return unstakedPools;
  }

  async loadVeBalPool(account) {
    if (!isEthNetwork(this.chainId)) return undefined;

    const { balancerContracts } = this.sdk;

    const lockPoolId = this.veBalPoolId();
    const lockPool = await this.findPool(lockPoolId);

    lockPool.totalLiquidity = await this.loadLiquidity(lockPool);

    const userLockInfo = await balancerContracts.veBal.getLockInfo(account);

    return {
      ...lockPool,
      shares: userLockInfo?.hasExistingLock
        ? getBptBalanceFiatValue(lockPool, userLockInfo.lockedAmount)
        : ZERO,
      lockedEndDate:
        userLockInfo?.hasExistingLock && !userLockInfo.isExpired
          ? userLockInfo.lockedEndDate
          : undefined,
    };
  }

  veBalPoolId() {
    return POOLS(this.chainId).IdsMap.veBAL;
  }

  totalAmount(pools) {
    if (!pools) return ZERO;

    return pools.find((pool) => pool.shares === false)
      ? false
      : pools
          .map((pool) => pool.shares)
          .reduce((total, shares) => total.plus(shares), ZERO);
  }

  async userBoosts(account) {
    const { veBal, veBalProxy } = this.sdk.balancerContracts;
    const { liquidityGauges } = this.sdk.data;

    const gaugeShares = await this.loadGaugeShares(account);

    const veBALInfo = await veBal.getLockInfo(account);
    const veBALBalance = await veBalProxy.getAdjustedBalance(account);

    const gaugeAddresses = gaugeShares.map((gaugeShare) => gaugeShare.gauge.id);
    const workingSupplies = await liquidityGauges.multicall.getWorkingSupplies(
      gaugeAddresses
    );

    const boosts = gaugeShares.map((gaugeShare) => {
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

  ERC20(address, signerOrProvider) {
    return this.sdk.balancerContracts.getErc20(address, signerOrProvider);
  }

}
