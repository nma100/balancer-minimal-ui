import { parseUnits } from "ethers/lib/utils";
import { BigNumber } from "ethers";
import { web3Account } from "../../web3-connect";

const MAX_POOLS = 4;
const GAS_PRICE = parseUnits('1', 9);

export const Given = { In: 0, Out: 1 };

export class SwapService {

    poolsPromise;
  
    constructor(swapper) {
        this.swapper = swapper;
        this.initPools();
    }

    initPools() {
        this.poolsPromise = this.swapper.fetchPools();
        this.poolsPromise.then(() => console.log('Pools loaded.'));
    }

    async findRoute(kind, tokens, amount) {

        const { tokenIn, tokenOut } = tokens;

        await this.poolsPromise;

        const params = { 
            tokenIn: tokenIn.address, 
            tokenOut: tokenOut.address, 
            gasPrice: GAS_PRICE,
            maxPools: MAX_POOLS,
        };

        if (kind === Given.In) {
            params.amount = parseUnits(amount, tokenIn.decimals);
            return await this.swapper.findRouteGivenIn(params);
        } else {
            params.amount = parseUnits(amount, tokenOut.decimals);
            return await this.swapper.findRouteGivenOut(params);
        }
    }


    async swap(swapInfo, web3Provider) {
        const {route, kind, maxSlippage } = swapInfo;
        const signer = web3Provider.getSigner();
        const userAddress = await web3Account(web3Provider);

        const deadline = BigNumber.from(`${Math.ceil(Date.now() / 1000) + 600}`); 

        const { to, data, value } = this.swapper.buildSwap({
            swapInfo: route,
            userAddress, kind,
            deadline, maxSlippage,
        });
    
        return await signer.sendTransaction({ to, data, value });
    }
}
