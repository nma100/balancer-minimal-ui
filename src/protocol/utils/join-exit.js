import { isSameAddress } from "@balancer-labs/sdk";
import { ZERO, toEthersBN } from "../../utils/bn";
import { formatUnits } from "ethers/lib/utils";


export function params(joinExitInfo) {
    const { pool: { tokens }, params } = joinExitInfo;
    const tokensNoBpt = tokens.filter(t => !isSameAddress(t.address, joinExitInfo.pool.address))
    const t = tokensNoBpt.map(t => t.address);
    const a = tokensNoBpt.map(t => { 
        const index = params.findIndex(({ token: pt }) => isSameAddress(pt.address, t.address));
        const value = (index === -1) ? ZERO : params[index].amount;
        const amount = toEthersBN(value, t.decimals);
        return formatUnits(amount, 0);
    });
    return { tokens: t, amounts: a };
}