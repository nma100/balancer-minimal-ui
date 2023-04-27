import { isSameAddress } from "@balancer-labs/sdk";
import { ZERO, bn, toEthersBN } from "../../utils/bn";
import { formatUnits } from "ethers/lib/utils";
import { getPoolTokens } from "../../utils/pool";


export function params(joinExitInfo) {
    const { pool: { tokens: poolTokens }, params } = joinExitInfo;
    const tokensNoBpt = poolTokens.filter(t => !isSameAddress(t.address, joinExitInfo.pool.address))
    const t = tokensNoBpt.map(t => t.address);
    const a = tokensNoBpt.map(t => { 
        const index = params.findIndex(({ token: pt }) => isSameAddress(pt.address, t.address));
        const value = (index === -1) ? ZERO : params[index].amount;
        const amount = toEthersBN(value, t.decimals);
        return formatUnits(amount, 0);
    });
    return { tokens: t, amounts: a };
}

export async function proportionalBalances(balancer, account, pool, slippage) {
    const tokens = getPoolTokens(pool);
    const slippagePercent = slippage / 10000;
    const userPoolBalance = await balancer.userBalance(account, pool);
    const userPoolRatio = userPoolBalance.div(bn(pool.totalShares)).times(1 - slippagePercent);
    const userTokensBalances = tokens.map(t => {
        return { tokenAddress: t.address, balance: userPoolRatio.times(bn(t.balance)) };
    });
    return { userTokensBalances, userPoolBalance };
}