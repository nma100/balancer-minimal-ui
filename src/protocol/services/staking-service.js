import { POOLS } from "@balancer-labs/sdk";
import { isEthNetwork } from "../../networks";
import { ZERO } from "../../utils/bn";
import { getBptBalanceFiatValue } from "../../utils/pool";
import { GaugeShareRepo } from "../repository/gauge-share-repo";
import { PoolRepo } from "../repository/pool-repo";
import { PoolShareRepo } from "../repository/pool-share-repo";
import { LiquidityService } from "./liquidity-service";
import { POOLS as POOLS_CONST } from "../constants/pools";


export class StakingService {
  
    constructor(sdk) {
        this.chainId = `${sdk.networkConfig.chainId}`;
        this.balancerContracts = sdk.balancerContracts;
        this.liquidityService = new LiquidityService(sdk.pools);
        this.poolRepo = new PoolRepo(sdk);
        this.poolShareRepo = new PoolShareRepo(sdk.data);
        this.gaugeShareRepo = new GaugeShareRepo(sdk.data);
    }

    async fetchStakedPools(account) {
        const gaugeShares = await this.gaugeShareRepo.fetchGaugeShares(account);
        const stakedPoolIds = gaugeShares.map((share) => share.gauge.poolId);
    
        let stakedPools = await this.poolRepo.findPools(stakedPoolIds);
    
        stakedPools = stakedPools.map((pool) => {
          const stakedBpt = gaugeShares.find((gs) => gs.gauge.poolId === pool.id);
          return {
            ...pool,
            bpt: stakedBpt.balance,
          };
        });
    
        return stakedPools;
    }

    async fetchUnstakedPools(account) {
        const poolShares = await this.poolShareRepo.fetchPoolShares(account);
        const unStakedPoolIds = poolShares.map((poolShare) => poolShare.poolId);
    
        let unstakedPools = (await this.poolRepo.findPools(unStakedPoolIds)).filter(
          (pool) => !this.excludedPoolTypes().includes(pool.poolType)
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

    async fetchVeBal(account) {
        if (!isEthNetwork(this.chainId)) return undefined;
    
        const lockPoolId = this.veBalPoolId();
        const lockPool = await this.poolRepo.findPool(lockPoolId);
    
        lockPool.totalLiquidity = await this.liquidityService.liquidity(lockPool);
    
        const userLockInfo = await this.balancerContracts.veBal.getLockInfo(account);
    
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

    excludedPoolTypes() {
        return POOLS(this.chainId).ExcludedPoolTypes;
    }
    
    stakablePoolIds() {
      const { VotingGaugePools, AllowList } = POOLS_CONST[this.chainId].Stakable;
      return VotingGaugePools.concat(AllowList);
    }
}