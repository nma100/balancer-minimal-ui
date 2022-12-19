import { parseUnits } from "ethers/lib/utils";

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
}
