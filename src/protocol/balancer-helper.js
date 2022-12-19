import {
  BalancerSDK,
  PoolsSubgraphRepository,
  POOLS,
} from "@balancer-labs/sdk";
import { isEthNetwork } from "../networks";
import { getRpcUrl } from "../utils/rpc";
import { getBptBalanceFiatValue } from "../utils/pool";
import { bnum, ZERO } from "../utils/bnum";
import { TokenListService } from "./services/token-list-service";
import { AprService } from "./services/apr-service";
import { LiquidityService } from "./services/liquidity-service";
import { SwapService } from "./services/swap-service";

export class BalancerHelper {
  
  constructor(chainId) {
    this.chainId = chainId;
    this.sdk = new BalancerSDK({
      network: Number(chainId),
      rpcUrl: getRpcUrl(chainId),
      sor: { fetchOnChainBalances: false }
    });
    this.aprService = new AprService(this.sdk.pools);
    this.liquidityService = new LiquidityService(this.sdk.pools);
    this.swapService = new SwapService(this.sdk.swaps);
    this.tokenListService = new TokenListService(chainId);
  }

  async loadApr(pool) {
    return await this.aprService.apr(pool);
  }

  async loadLiquidity(pool) {
    return await this.liquidityService.liquidity(pool);
  }

  async findRouteGivenIn(tokenIn, tokenOut, amount) {
    console.log('findRouteGivenIn', tokenIn, tokenOut, amount?.toString());
    return await this.swapService.findRouteGivenIn(tokenIn, tokenOut, amount);
  }

  async findRouteGivenOut(tokenIn, tokenOut, amount) {
    console.log('findRouteGivenOut', tokenIn, tokenOut, amount?.toString());
    return await this.swapService.findRouteGivenOut(tokenIn, tokenOut, amount);
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
  
  async findPreferentialGauge(poolAddress) {
    const result = await this.sdk.data.poolGauges.find(poolAddress);
    if (!result) {
      return undefined;
    } else if (result.gauges.length === 1) {
      return result.gauges[0].id;
    } else {
      return result.preferentialGauge.id;
    }
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

  stakablePoolIds() {
    return POOLS(this.chainId).Stakable.AllowList;
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

  async fetchTokens() {
    const tokens = this.tokenListService.approvedTokens();
    return TokenListService.reduce(await tokens);
  }

  async findToken(symbol) {
    const tokens = await this.fetchTokens();
    return tokens.find(t => t.symbol === symbol);
  }

  loadPortfolio(account, callback) {

    callback({ 
      account: account,
      portfolio: true,
      stakedPools: undefined,
      unstakedPools: undefined,
      veBalPool: undefined,
      stakedAmount: undefined,
      unstakedAmount: undefined,
      veBalAmount: undefined,
    });

    this.loadStakedPools(account)
      .then((pools) => {
        callback({ stakedPools: pools });
        if (pools.length === 0) {
          callback({ stakedAmount: ZERO });
        }
        return pools;
      })
      .then(async (pools) => {
        for (const pool of pools) {
          this.loadLiquidity(pool)
            .then((liquidity) => {
              pool.totalLiquidity = liquidity;
              pool.shares = getBptBalanceFiatValue(pool, pool.bpt);
            })
            .catch(() => pool.shares = false)
            .finally(() =>
              callback({ stakedAmount: this.totalAmount(pools) })
            );
        }
      });

    this.loadUnstakedPools(account)
      .then((pools) => {
        callback({ unstakedPools: pools });
        if (pools.length === 0) {
          callback({ unstakedAmount: ZERO });
        }
        return pools;
      })
      .then(async (pools) => {
        for (const pool of pools) {
          this.loadLiquidity(pool)
            .then((liquidity) => {
              pool.totalLiquidity = liquidity;
              pool.shares = getBptBalanceFiatValue(pool, pool.bpt);
            })
            .catch(() => pool.shares = false)
            .finally(() =>
              callback({ unstakedAmount: this.totalAmount(pools) })
            );
        }
      });
      
    this.loadVeBalPool(account)
      .then((pool) => {
        callback({ veBalPool: pool });
        return pool;
      })
      .then((pool) => {
        callback({
          veBalAmount: pool?.shares || ZERO,
        });
      });
  }

  ERC20(erc20address, signerOrProvider) {
    const { balancerContracts } = this.sdk;
    return balancerContracts.getErc20(erc20address, signerOrProvider);
  }

  liquidityGauge(gaugeAddress, signerOrProvider) {
    const { balancerContracts } = this.sdk;
    return balancerContracts.getLiquidityGauge(gaugeAddress, signerOrProvider);
  }

}
