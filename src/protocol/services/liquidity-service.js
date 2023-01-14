import { bn } from "../../utils/bn";

export class LiquidityService {
  
    constructor(pools) {
        this.pools = pools;
        this.cache = {};
    }

    async liquidity(pool) {
        if (!this.cache[pool.id]) {
            this.cache[pool.id] = this.pools.liquidity(pool);
        }
        const liquidity = await this.cache[pool.id];
        this.check(pool, liquidity);
        return liquidity;
      }
    
    check(pool, liquidity) {
        const n = bn(liquidity);
        if (n.isNaN() || !n.isFinite() || n.isZero()) {
            const msg = `Incorrect liquidity value (${pool.name}) : ${liquidity}`;
            console.error(msg);
            throw new Error(msg);
        }
    }

}