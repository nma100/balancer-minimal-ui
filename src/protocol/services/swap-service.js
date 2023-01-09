import { parseUnits } from "ethers/lib/utils";
import { BigNumber } from "ethers";
import { web3Account } from "../../web3-connect";

const MAX_POOLS = 4;
const GAS_PRICE = parseUnits('1', 9);

const Given = { In: 0, Out: 1 }

export class SwapService {

    poolsLoaded = false;
  
    constructor(swapper) {
        this.swapper = swapper;
        this.initPools()
            .then(loaded => { 
                console.log('Pools loaded');
                this.poolsLoaded = loaded; 
            });
    }

    async initPools() {
        return await this.swapper.fetchPools();
    }

    async findRoute(kind, tokens, value) {

        const { tokenIn, tokenOut } = tokens;
        
        if (this.poolsLoaded === false) {
            console.time('Fetch pools');
            this.poolsLoaded = await this.initPools();
            console.timeEnd('Fetch pools');
        } else {
            console.log('Pools already loaded');
        }
        
        const params = { 
            tokenIn: tokenIn.address, 
            tokenOut: tokenOut.address, 
            gasPrice: GAS_PRICE,
            maxPools: MAX_POOLS,
        };

        if (kind === Given.In) {
            params.amount = parseUnits(value, tokenIn.decimals);
            return await this.swapper.findRouteGivenIn(params);
        } else {
            params.amount = parseUnits(value, tokenOut.decimals);
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
