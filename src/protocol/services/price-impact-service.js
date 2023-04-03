import { Pools, isSameAddress } from "@balancer-labs/sdk";
import { web3Account } from "../../web3-connect";
import { ZERO, toEthersBN } from "../../utils/bn";
import { formatUnits } from "ethers/lib/utils";

const SLIPPAGE = '100';

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
        const { tokens, amounts } = this.params(joinInfo);

        const account = await web3Account(web3Provider);

        const poolWithMethods = Pools.wrap(pool, this.sdk.networkConfig);
        const { expectedBPTOut } = poolWithMethods.buildJoin(account, tokens, amounts, SLIPPAGE);

        const pi_ = await poolWithMethods.calcPriceImpact(amounts, expectedBPTOut, true);
        const pi = formatUnits(pi_);

        return Number(pi) * 100;
    }

    async exitPi(exitInfo, web3Provider) {
        const { pool } = exitInfo;
        const { tokens, amounts } = this.params(exitInfo);

        const account = await web3Account(web3Provider);

        const poolWithMethods = Pools.wrap(pool, this.sdk.networkConfig);
        const { priceImpact } = poolWithMethods.buildExitExactTokensOut(
            account, tokens, amounts, SLIPPAGE
        );

        const pi = formatUnits(priceImpact);
        return Number(pi) * 100;
    }

    params(info) {
        const { pool: { tokens }, params } = info;
        const t = tokens.map(t => t.address);
        const a = tokens.map(t => { 
            const index = params.findIndex(({ token: pt }) => isSameAddress(pt.address, t.address));
            const value = (index === -1) ? ZERO : params[index].amount;
            const amount = toEthersBN(value, t.decimals);
            return formatUnits(amount, 0);
        });
        return { tokens: t, amounts: a };
    }
}