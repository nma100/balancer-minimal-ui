import { POOLS, PoolsSubgraphRepository } from "@balancer-labs/sdk"; 

export class PoolRepo {
  
    constructor(sdk) {
        const { chainId, urls: { subgraph: url } } = sdk.networkConfig;
        this.config = { chainId, url };
        this.pools  = sdk.pools;
    }
    
    async fetchPools(first, skip) {
        const query = this.defaultFetchArgs();
        return await this.subgraph({ query, first, skip });
    }

    async findPool(poolId) {
        const query = { args: { where: { id: { eq: poolId } } } };
        return (await this.subgraph({ query }))[0];   
     }

    async findPools(poolIds) {
        const query = { args: { where: { id: { in: poolIds } } } };
        return await this.subgraph({ query });
    }
    
    async findPoolsByToken(tokenAddress) {
        let query = this.defaultFetchArgs();
        query.args.where.tokensList = { contains: [ tokenAddress.toLowerCase() ] };
        return await this.subgraph({ query });
    }

    async subgraph({ query, first, skip }) {
        const repo = new PoolsSubgraphRepository({ ...this.config, query });
        return await repo.fetch({ first, skip });    
    }

    defaultFetchArgs() {
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