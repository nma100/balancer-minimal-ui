import { switchChain } from "./web3-connect";

export class BlockExplorer {
  constructor(url, addrUri, txUri) {
    this.url = url;
    this.addrUri = addrUri;
    this.txUri = txUri;
  }
}

export class Chain {
  constructor(id, name, decimal, explorerUrl, 
    explorerAddr, explorerTx) {
    this.id = id;
    this.name = name;
    this.decimal = decimal;
    this.blockExplorer = new BlockExplorer(
      explorerUrl, 
      explorerAddr, 
      explorerTx);
  }
}

export const ETHEREUM_ID = '1', POLYGON_ID = '137', ARBITRUM_ID = '42161', GOERLI_ID = '5';

export const NETWORKS = {
  [ETHEREUM_ID] : new Chain(ETHEREUM_ID, 'Ethereum', 18, 'https://etherscan.io', '/address/{0}', '/tx/{0}'),
  [POLYGON_ID]  : new Chain(POLYGON_ID, 'Polygon', 18, 'https://polygonscan.com', '/address/{0}', '/tx/{0}'),
  [ARBITRUM_ID] : new Chain(ARBITRUM_ID, 'Arbitrum', 18, 'https://arbiscan.com', '/address/{0}', '/tx/{0}'),
  [GOERLI_ID]   : new Chain(GOERLI_ID, 'Goerli', 18, 'https://goerli.etherscan.io', '/address/{0}', '/tx/{0}')
}

export async function checkChain(chainId, library) {
  let id = `${chainId}`;
  if (!NETWORKS[id]) {
    id = defaultChainId();
    await switchChain(id, library);
  }
  return id;
}

export function defaultChainId() {
  return process.env.NODE_ENV === 'production' ? ETHEREUM_ID : GOERLI_ID;
}
