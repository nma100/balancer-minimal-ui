import { PoolsSubgraphRepository } from "@balancer-labs/sdk"; 

export class PoolRepo {
  
    constructor(sdk) {
        this.config = sdk.networkConfig;
        this.pools  = sdk.pools;
    }

    async findPool(poolId) {
        return await this.pools.find(poolId);
    }

    async findPools(poolIds) {
        const { chainId, urls: { subgraph: url } } = this.config;
        const query = {
            args: { where: { id: { in: poolIds } } },
        };
        const subgraph = new PoolsSubgraphRepository({ chainId, url, query });
        return await subgraph.fetch();
    }

    async fetchPools(first = 10, skip = 0) {
        const { chainId, urls: { subgraph: url } } = this.config;
        const subgraph = new PoolsSubgraphRepository({ chainId, url });
        return await subgraph.fetch({ first, skip });    
    }
    
}