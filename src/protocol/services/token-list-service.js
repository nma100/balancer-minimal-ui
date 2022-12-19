import { TOKEN_LIST_MAP } from "../constants/token-lists";

export class TokenListService {
  
    constructor(chainId) {
        this.chainId = chainId;
    }

    urls() {
        return TOKEN_LIST_MAP[this.chainId];
    }

    async allTokens() {
        return await import(`../resources/token-lists/tokens-${this.chainId}.json`);
    }

    async defaultTokens() {
        const { Balancer } = this.urls();
        return (await this.allTokens())[Balancer.Default];
    }

    async vettedTokens() {
        const { Balancer } = this.urls();
        return (await this.allTokens())[Balancer.Vetted];
    }

    async approvedTokens() {
        const { Balancer, External } = this.urls();
        const Approved = [Balancer.Default, ...External];
        return Object
            .entries(await this.allTokens())
            .filter(([K,V]) => Approved.includes(K))
            .map(([K,V]) => V);
    }

    static reduce(tab) {
        return tab.reduce((accu, current) => accu.concat(current.tokens), []);
    }
    
}