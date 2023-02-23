import { POOLS, PoolsSubgraphRepository } from "@balancer-labs/sdk"; 

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
    
    async findPoolsByToken(address) {
      const { chainId, urls: { subgraph: url } } = this.config;
      const query = {
          args: { 
              orderBy: 'totalLiquidity',
              orderDirection: 'desc',
              where: { 
                  tokensList: { contains: [ address.toLowerCase() ] },
                  poolType: { not_in: POOLS(chainId).ExcludedPoolTypes},
                  id: { not_in: POOLS(chainId).BlockList },
                  totalShares: { gt: 0.01 },
              } 
          },
      };
      const subgraph = new PoolsSubgraphRepository({ chainId, url, query });
      return await subgraph.fetch();   
    }

    async fetchPools(first, skip) {
        const { chainId, urls: { subgraph: url } } = this.config;
        const query = {
            args: { 
                orderBy: 'totalLiquidity',
                orderDirection: 'desc',
                where: { 
                    poolType: { not_in: POOLS(chainId).ExcludedPoolTypes},
                    id: { not_in: POOLS(chainId).BlockList },
                    totalShares: { gt: 0.01 },
                } 
            },
        };
        const subgraph = new PoolsSubgraphRepository({ chainId, url, query });
        return await subgraph.fetch({ first, skip });    
    }

}