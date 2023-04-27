import { Pools } from "@balancer-labs/sdk";
import { web3Account } from "../../web3-connect";
import { params } from "../utils/join-exit";

export class JoinPoolService {
  
    constructor(sdk) {
        this.sdk = sdk;
    }

    async join(joinInfo, web3Provider) {
        const { pool } = joinInfo;
        const { tokens, amounts } = params(joinInfo);
        const slippage = String(joinInfo.maxSlippage);

        const signer = web3Provider.getSigner();
        const account = await web3Account(web3Provider);

        const poolWithMethods = Pools.wrap(pool, this.sdk.networkConfig);
        const { to, data } = poolWithMethods.buildJoin(account, tokens, amounts, slippage);

        return await signer.sendTransaction({ to, data });
    }

}