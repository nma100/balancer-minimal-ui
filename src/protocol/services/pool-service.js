import { PoolRepo } from "../repository/pool-repo";

export class PoolService {
  
    constructor(sdk) {
        this.poolRepo = new PoolRepo(sdk);
    }

    async fetchPools(first, skip) {
        return await this.poolRepo.fetchPools(first, skip);
    }

}