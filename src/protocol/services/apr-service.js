export class AprService {
  
    constructor(pools) {
        this.pools = pools;
        this.cache = {};
    }

    async apr(pool) {
        if (!this.cache[pool.id]) {
          this.cache[pool.id] = this.pools.apr(pool);
        } 
        const apr = await this.cache[pool.id];
        this.check(pool, apr);
        return apr;
    }
    
    check(pool, apr) {
        const isValid = (n) => isFinite(n) && !isNaN(n);
        let err = false;
        if (!apr) err = `Falsy apr = ${apr}`;
        else if (!isValid(apr.swapFees)) err = `apr.swapFees = ${apr.swapFees}`;
        else if (!isValid(apr.protocolApr)) err = `apr.protocolApr = ${apr.protocolApr}`;
        else if (!isValid(apr.tokenAprs.total)) err = `apr.tokenAprs.total = ${apr.tokenAprs.total}`;
        else if (!isValid(apr.stakingApr.min)) err = `apr.stakingApr.min = ${apr.stakingApr.min}`;
        else if (!isValid(apr.stakingApr.max)) err = `apr.stakingApr.max = ${apr.stakingApr.max}`;
        else if (!isValid(apr.rewardAprs.total)) err = `apr.rewardAprs.total = ${apr.rewardAprs.total}`;
        else if (!isValid(apr.min)) err = `apr.min = ${apr.min}`;
        else if (!isValid(apr.max)) err = `apr.max = ${apr.max}`;
        if (err !== false) {
            const msg = `Invalid APR (${pool.name}) : ${err}`;
            console.error(msg, apr);
            throw new Error(msg);
        }
    }

}