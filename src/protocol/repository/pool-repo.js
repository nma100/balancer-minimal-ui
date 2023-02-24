import { POOLS, PoolsSubgraphRepository } from "@balancer-labs/sdk"; 

export class PoolRepo {
  
    constructor(sdk) {
        const { chainId, urls: { subgraph: url } } = sdk.networkConfig;
        this.config = { chainId, url };
        this.pools  = sdk.pools;
    }

    async findPool(poolId) {
        return await this.pools.find(poolId);
    }

    async findPools(poolIds) {
        const { chainId, url } = this.config;
        const query = { args: { where: { id: { in: poolIds } } } };
        const subgraph = new PoolsSubgraphRepository({ chainId, url, query });
        return await subgraph.fetch();
    }
    
    async findPoolsByToken(address) {
        const { chainId, url } = this.config;
        let query = this.fetchArgs();
        query.args.where.tokensList = { contains: [ address.toLowerCase() ] };
        const subgraph = new PoolsSubgraphRepository({ chainId, url, query });
        return await subgraph.fetch();   
    }

    async fetchPools(first, skip) {
        const { chainId, url } = this.config;
        const query = this.fetchArgs();
        const subgraph = new PoolsSubgraphRepository({ chainId, url, query });
        return await subgraph.fetch({ first, skip });    
    }

    fetchArgs() {
        const { chainId } = this.config;
        return {
            args: { 
                orderBy: 'totalLiquidity',
                orderDirection: 'desc',
                where: { 
                    poolType: { not_in: POOLS(chainId).ExcludedPoolTypes},
                    id: { not_in: POOLS(chainId).BlockList },
                    totalShares: { gt: 0.01 },
                } 
            }
        };
    }

}