import { parseUnits } from "ethers/lib/utils";
import { BigNumber } from "ethers";

const GAS_PRICE = parseUnits('1', 9);
const MAX_POOLS = 4;

export class SwapService {
  
    constructor(swapper) {
        this.swapper = swapper;
    }

    async findRouteGivenIn(tokenIn, tokenOut, amount) {
        
        await this.swapper.fetchPools();

        return await this.swapper.findRouteGivenIn({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amount: amount,
            gasPrice: GAS_PRICE,
            maxPools: MAX_POOLS,
        });
    }

    async findRouteGivenOut(tokenIn, tokenOut, amount) {
        
        await this.swapper.fetchPools();

        return await this.swapper.findRouteGivenOut({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amount: amount,
            gasPrice: GAS_PRICE,
            maxPools: MAX_POOLS,
        });
    }

    async swap(route, kind, signer, account) {
        const slippage = 50;
        const tenMinutes = BigNumber.from(`${Math.ceil(Date.now() / 1000) + 600}`); 

        const { to, data, value } = this.swapper.buildSwap({
            userAddress: account,
            swapInfo: route,
            kind: kind,
            deadline: tenMinutes,
            maxSlippage: slippage,
        });
    
        return await signer.sendTransaction({ to, data, value });
    }
}
