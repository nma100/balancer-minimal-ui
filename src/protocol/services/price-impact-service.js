import { Pools } from "@balancer-labs/sdk";
import { web3Account } from "../../web3-connect";
import { formatUnits } from "ethers/lib/utils";
import { params } from "../utils/join-exit";

export class PriceImpactService {
  
    constructor(sdk) {
        this.sdk = sdk;
    }

    async pi(info, web3Provider, isJoin) {
        const method = isJoin ? this.joinPi : this.exitPi;
        return await method.bind(this)(info, web3Provider);
    }

    async joinPi(joinInfo, web3Provider) {
        const { pool } = joinInfo;
        const { tokens, amounts } = params(joinInfo);
        const slippage = String(joinInfo.maxSlippage);

        const account = await web3Account(web3Provider);

        const poolWithMethods = Pools.wrap(pool, this.sdk.networkConfig);
        const { expectedBPTOut } = poolWithMethods.buildJoin(account, tokens, amounts, slippage);

        const pi_ = await poolWithMethods.calcPriceImpact(amounts, expectedBPTOut, true);
        const pi = formatUnits(pi_);

        return Number(pi) * 100;
    }

    async exitPi(exitInfo, web3Provider) {
        const { pool } = exitInfo;
        const { tokens, amounts } = params(exitInfo);
        const slippage = String(exitInfo.maxSlippage);

        const account = await web3Account(web3Provider);

        const poolWithMethods = Pools.wrap(pool, this.sdk.networkConfig);
        const { priceImpact } = poolWithMethods.buildExitExactTokensOut(
            account, tokens, amounts, slippage
        );

        const pi = formatUnits(priceImpact);
        return Number(pi) * 100;
    }
}