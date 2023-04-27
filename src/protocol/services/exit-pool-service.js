import { Pools } from "@balancer-labs/sdk";
import { web3Account } from "../../web3-connect";
import { params } from "../utils/join-exit";

export class ExitPoolService {

    constructor(sdk) {
        this.sdk = sdk;
    }

    async buildTx(exitInfo, web3Provider) {
        const { pool } = exitInfo;
        const { tokens, amounts } = params(exitInfo);
        const slippage = String(exitInfo.maxSlippage);

        const account = await web3Account(web3Provider);

        const poolWithMethods = Pools.wrap(pool, this.sdk.networkConfig);

        return poolWithMethods.buildExitExactTokensOut(
            account, tokens, amounts, slippage
        );
    }

    async exit(exitInfo, web3Provider) {
        const { to, data } = await this.buildTx(exitInfo, web3Provider);
        return await web3Provider.getSigner().sendTransaction({ to, data });
    }
}