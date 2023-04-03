import { isSameAddress, Pools } from "@balancer-labs/sdk";
import { formatUnits } from "ethers/lib/utils";
import { toEthersBN, ZERO } from "../../utils/bn";
import { web3Account } from "../../web3-connect";

const SLIPPAGE = '100';

export class ExitPoolService {

    constructor(sdk) {
        this.sdk = sdk;
    }
    
    async exit(exitInfo, web3Provider) {
        console.log('directExit', exitInfo);

        const { pool } = exitInfo;
        const { tokens, amounts } = this.params(exitInfo);

        const signer = web3Provider.getSigner();
        const account = await web3Account(web3Provider);

        console.log('directExit', exitInfo);
        console.log('directExit', account, tokens, amounts, SLIPPAGE);
        
        const poolWithMethods = Pools.wrap(pool, this.sdk.networkConfig);
        const { to, data } = poolWithMethods.buildExitExactTokensOut(
            account, tokens, amounts, SLIPPAGE
        );

        return await signer.sendTransaction({ to, data });
    }

    params(exitInfo) {
        const { pool: { tokens }, params } = exitInfo;
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