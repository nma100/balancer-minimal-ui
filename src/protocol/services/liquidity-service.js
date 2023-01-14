export class LiquidityService {
  
    constructor(pools) {
        this.pools = pools;
        this.cache = {};
    }

    async liquidity(pool) {
        if (!this.cache[pool.id]) {
            this.cache[pool.id] = this.pools.liquidity(pool);
        }
        return await this.cache[pool.id];
      }
      
    clearCache() {
        this.cache = {};
    }
}