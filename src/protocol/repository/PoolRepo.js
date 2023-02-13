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
        const { chainId, urls } = this.config;
        const query = {
            args: { where: { id: { in: poolIds } } },
        };
        const subgraph = new PoolsSubgraphRepository({
            chainId: chainId,
            url: urls.subgraph,
            query: query,
        });
        return await subgraph.fetch();
    }
    
}