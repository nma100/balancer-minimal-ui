export class AprService {
  
    constructor(pools) {
        this.pools = pools;
        this.cache = {};
    }

    async apr(pool) {
        if (!this.cache[pool.id]) {
          this.cache[pool.id] = this.pools.apr(pool);
        } 
        return await this.cache[pool.id];
    }
    
    clearCache() {
        this.cache = {};
    }
}