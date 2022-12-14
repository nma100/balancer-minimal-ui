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
            .filter(([K,]) => Approved.includes(K))
            .map(([,V]) => V);
    }

    static reduce(tab, chainId) {
        return tab.reduce((accu, current) => {
            current.tokens
                .filter(t => t.chainId === Number(chainId))
                .forEach(token => {
                    if (!accu.find(t => t.address === token.address)) {
                        accu.push(token);
                    }
                });
            return accu;
        }, []);
    }
    
}