import { constants } from "ethers";
import { bn, ZERO, ONE } from "../../utils/bn";

const NATIVE_ASSET = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

const { AddressZero } = constants;

export class TokenPriceService {
  
    constructor(data) {
        this.tokenPrices = data.tokenPrices;
    }

    async fetch(token, amount = ONE) {
        if (!token || !amount || amount.isZero()) return ZERO;
        
        const address = (token === AddressZero) ? NATIVE_ASSET : token;

        const price = await this.tokenPrices.find(address);
        if (!price?.usd) return undefined;

        return bn(price.usd).times(amount);
    }
   
}