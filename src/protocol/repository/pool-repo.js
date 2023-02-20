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

    /*
    const queryArgs: GraphQLArgs = {
      chainId: configService.network.chainId,
      orderBy: 'totalLiquidity',
      orderDirection: 'desc',
      where: {
        tokensList: { [tokensListFilterOperation]: tokenListFormatted },
        poolType: { not_in: POOLS.ExcludedPoolTypes },
        totalShares: { gt: 0.01 },
        id: { not_in: POOLS.BlockList },
      },
    };
    if (queryArgs.where && filterOptions?.poolIds?.value) {
      queryArgs.where.id = { in: filterOptions.poolIds.value };
    }
    if (queryArgs.where && filterOptions?.poolAddresses?.value) {
      queryArgs.where.address = { in: filterOptions.poolAddresses.value };
    }
    if (options.first) {
      queryArgs.first = options.first;
    }
    if (options.skip) {
      queryArgs.skip = options.skip;
    }
    return queryArgs;
  }

    */

  /*

    interface PoolsSubgraphRepositoryOptions {
        url: string;
        chainId: Network;
        blockHeight?: () => Promise<number | undefined>;
        query?: GraphQLQuery;
    }

    export interface GraphQLQuery {
        args: GraphQLArgs;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        attrs: any;
    }

    export interface GraphQLArgs {
        chainId?: number;
        first?: number;
        skip?: number;
        nextToken?: string;
        orderBy?: string;
        orderDirection?: string;
        block?: {
            number?: number;
        };
        where?: Record<string, GraphQLFilter>;
    }

    
    const defaultArgs: GraphQLArgs = {
      orderBy: Pool_OrderBy.TotalLiquidity,
      orderDirection: OrderDirection.Desc,
      where: {
        swapEnabled: {
          eq: true,
        },
        totalShares: {
          gt: 0.000000000001,
        },
      },
    };

*/

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