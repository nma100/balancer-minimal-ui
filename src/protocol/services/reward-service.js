import { bn } from "../../utils/bn";
import { GaugeShareRepo } from "../repository/GaugeShareRepo";

export class RewardService {
  
    constructor(sdk) {
        this.sdk = sdk;
        this.gaugeShareRepo = new GaugeShareRepo(sdk.data);
    }

    async userBoosts(account) {
        const { veBal, veBalProxy } = this.sdk.balancerContracts;
        const { liquidityGauges } = this.sdk.data;
    
        const gaugeShares = await this.gaugeShareRepo.fetchGaugeShares(account);
    
        const veBALInfo = await veBal.getLockInfo(account);
        const veBALBalance = await veBalProxy.getAdjustedBalance(account);
    
        const gaugeAddresses = gaugeShares.map((gaugeShare) => gaugeShare.gauge.id);
        const workingSupplies = await liquidityGauges.multicall.getWorkingSupplies(
          gaugeAddresses
        );
    
        const boosts = gaugeShares.map((gaugeShare) => {
          const gaugeAddress = gaugeShare.gauge.id;
          const gaugeWorkingSupply = bn(workingSupplies[gaugeAddress]);
          const gaugeBalance = bn(gaugeShare.balance);
    
          const adjustedGaugeBalance = bn(0.4)
            .times(gaugeBalance)
            .plus(
              bn(0.6).times(
                bn(veBALBalance)
                  .div(veBALInfo.totalSupply)
                  .times(gaugeShare.gauge.totalSupply)
              )
            );
    
          const workingBalance = gaugeBalance.lt(adjustedGaugeBalance)
            ? gaugeBalance
            : adjustedGaugeBalance;
    
          const zeroBoostWorkingBalance = bn(0.4).times(gaugeBalance);
          const zeroBoostWorkingSupply = gaugeWorkingSupply
            .minus(workingBalance)
            .plus(zeroBoostWorkingBalance);
    
          const boostedFraction = workingBalance.div(gaugeWorkingSupply);
          const unboostedFraction = zeroBoostWorkingBalance.div(
            zeroBoostWorkingSupply
          );
    
          const boost = boostedFraction.div(unboostedFraction);
    
          return [gaugeShare.gauge.poolId, boost];
        });
    
        return Object.fromEntries(boosts);
    }

}