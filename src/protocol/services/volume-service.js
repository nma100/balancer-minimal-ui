export class VolumeService {
  
    constructor(pools) {
        this.pools = pools;
        this.cache = {};
    }

    async volume(pool) {
        if (!this.cache[pool.id]) {
          this.cache[pool.id] = this.pools.volume(pool);
        } 
        return await this.cache[pool.id];
    }
    
    clearCache() {
        this.cache = {};
    }
}