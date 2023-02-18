export class PoolShareRepo {
  
    constructor(data) {
        this.poolShares = data.poolShares;
    }

    async fetchPoolShares(account) {
        const args = {
            where: {
                userAddress: account.toLowerCase(),
                balance_gt: '0',
            },
        };
        return await this.poolShares.query(args);
    }

}