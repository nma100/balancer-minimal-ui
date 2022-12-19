import { bnum } from "../../utils/bnum";

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
        const bn = bnum(liquidity);
        if (bn.isNaN() || !bn.isFinite() || bn.isZero()) {
            const msg = `Incorrect liquidity value (${pool.name}) : ${liquidity}`;
            console.error(msg);
            throw new Error(msg);
        }
    }

}