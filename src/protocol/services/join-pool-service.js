import { isSameAddress, Pools } from "@balancer-labs/sdk";
import { formatUnits } from "ethers/lib/utils";
import { toEthersBN, ZERO } from "../../utils/bn";
import { web3Account } from "../../web3-connect";

const SLIPPAGE = '100';

export class JoinPoolService {
  
    constructor(sdk) {
        this.sdk = sdk;
    }

    async join(joinInfo, web3Provider) {
        const { pool } = joinInfo;
        const { tokens, amounts } = this.params(joinInfo);

        const signer = web3Provider.getSigner();
        const account = await web3Account(web3Provider);

        console.log('directJoin', joinInfo);
        console.log('directJoin', account, tokens, amounts, SLIPPAGE);

        const poolWithMethods = Pools.wrap(pool, this.sdk.networkConfig);
        const { to, data } = poolWithMethods.buildJoin(account, tokens, amounts, SLIPPAGE);

        return await signer.sendTransaction({ to, data });
    }

    params(joinInfo) {
        const { pool: { tokens }, params } = joinInfo;
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