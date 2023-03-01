import { POOLS, PoolsSubgraphRepository } from "@balancer-labs/sdk"; 

export class PoolRepo {
  
    constructor(sdk) {
        const { chainId, urls: { subgraph: url } } = sdk.networkConfig;
        this.config = { chainId, url };
        this.pools  = sdk.pools;
    }
    
    async fetchPools(first, skip) {
        const query = this.defaultArgs();
        return await this.subgraph({ query, first, skip });
    }

    async findPool(poolId) {
        return await this.pools.find(poolId);
    }

    async findPools(poolIds) {
        const query = { args: { where: { id: { in: poolIds } } } };
        return await this.subgraph({ query });
    }
    
    async findPoolsByToken(address) {
        let query = this.defaultArgs();
        query.args.where.tokensList = { contains: [ address.toLowerCase() ] };
        return await this.subgraph({ query });
    }

    async subgraph({ query, first, skip }) {
        const repo = new PoolsSubgraphRepository({ ...this.config, query });
        return await repo.fetch({ first, skip });    
    }

    defaultArgs() {
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