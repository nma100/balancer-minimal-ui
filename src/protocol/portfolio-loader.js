import { ZERO } from "../utils/bn";
import { getBptBalanceFiatValue } from "../utils/pool";
import { LiquidityService } from "./services/liquidity-service";
import { StakingService } from "./services/staking-service";

export class PortfolioLoader {

    constructor(account, bag, sdk) {
        this.account = account;
        this.bag = bag;
        this.stakingService = new StakingService(sdk);
        this.liquidityService = new LiquidityService(sdk.pools);
    }

    load() {
        this.init();

        this.stakingService.fetchStakedPools(this.account)
            .then(async (pools) => {
                this.bag({ stakedPools: pools });
                if (pools.length === 0) {
                    this.bag({ stakedAmount: ZERO });
                } else {
                    await this.amounts(pools);
                    this.bag({ stakedAmount: this.total(pools) });
                }
            });

        
      this.stakingService.fetchUnstakedPools(this.account)
        .then(async (pools) => {
                this.bag({ unstakedPools: pools });
                if (pools.length === 0) {
                    this.bag({ unstakedAmount: ZERO });
                } else {
                    await this.amounts(pools);
                    this.bag({ unstakedAmount: this.total(pools) });
                }
        });

      this.stakingService.fetchVeBal(this.account)
        .then((pool) => {
            this.bag({
                veBalPool: pool,
                veBalAmount: pool?.shares || ZERO,
            });
        });

    }

    amounts(pools) {
        const promises = [];
        pools.forEach(pool => {
            const promise = this.liquidityService.liquidity(pool)
                .then((liquidity) => {
                    pool.totalLiquidity = liquidity;
                    pool.shares = getBptBalanceFiatValue(pool, pool.bpt);
                })
                .catch(() => pool.shares = false);
            promises.push(promise);
        });
        return Promise.all(promises);
    }

    total(pools) {
        if (!pools) return ZERO;
        if (pools.find((pool) => pool.shares === false)) return false; 
        return pools.map((pool) => pool.shares || ZERO)
                    .reduce((total, shares) => total.plus(shares), ZERO);
    }

    init() {
        this.bag({ 
            account: this.account,
            portfolio: true,
            stakedPools: undefined,
            unstakedPools: undefined,
            veBalPool: undefined,
            stakedAmount: undefined,
            unstakedAmount: undefined,
            veBalAmount: undefined,
        });
    }

}