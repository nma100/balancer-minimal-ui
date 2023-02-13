export class GaugeShareRepo {

    constructor(data) {
      this.gaugeShares = data.gaugeShares;
    }

    async fetchGaugeShares(account) {
      const args = {
        where: {
          user: account.toLowerCase(),
          balance_gt: '0',
        },
      };
      return await this.gaugeShares.query(args);
    }

}