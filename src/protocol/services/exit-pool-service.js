import { Pools } from "@balancer-labs/sdk";
import { web3Account } from "../../web3-connect";
import { params } from "../utils/join-exit";

const SLIPPAGE = '100';

export class ExitPoolService {

    constructor(sdk) {
        this.sdk = sdk;
    }
    
    async exit(exitInfo, web3Provider) {
        console.log('directExit', exitInfo);

        const { pool } = exitInfo;
        const { tokens, amounts } = params(exitInfo);

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

}