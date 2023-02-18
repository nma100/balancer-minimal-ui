import { switchChain } from "./web3-connect";
import { constants } from "ethers";
import { Chain } from "./model/chain";

export const ETHEREUM_ID = '1', POLYGON_ID = '137', ARBITRUM_ID = '42161', GOERLI_ID = '5', SEPOLIA_ID = '11155111';

export const NETWORKS = {
  [ETHEREUM_ID] : new Chain(ETHEREUM_ID, 'Ethereum', 18, 'https://etherscan.io', '/address', '/tx'),
  [POLYGON_ID]  : new Chain(POLYGON_ID, 'Polygon', 18, 'https://polygonscan.com', '/address', '/tx'),
  [ARBITRUM_ID] : new Chain(ARBITRUM_ID, 'Arbitrum', 18, 'https://arbiscan.io', '/address', '/tx'),
  [GOERLI_ID]   : new Chain(GOERLI_ID, 'Goerli', 18, 'https://goerli.etherscan.io', '/address', '/tx'),
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

export function nativeAsset(chainId) {
  return {
    symbol: chainId === POLYGON_ID ? 'MATIC' : 'ETH',
    address: constants.AddressZero,
    decimals: 18,
  }
}

export function transactionUrl(chainId, txId) {
  if (!chainId || !txId) return '';
  const { url, txUri} = NETWORKS[chainId].blockExplorer;
  return `${url}${txUri}/${txId}`;
}

export const isEthMainnet = (networkId) => ETHEREUM_ID === networkId;
export const isEthTestnet = (networkId) => GOERLI_ID === networkId || SEPOLIA_ID === networkId;
export const isEthNetwork = (networkId) => isEthMainnet(networkId) || isEthTestnet(networkId);
