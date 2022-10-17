import { ETHEREUM_ID, POLYGON_ID, ARBITRUM_ID, GOERLI_ID } from "../networks";

const { REACT_APP_INFURA, REACT_APP_ALCHEMY_POLYGON, REACT_APP_ALCHEMY_ARBITRUM } = process.env;

export function getRpcUrl(chainId) {
  try {
    return getInfuraUrl(chainId);
  } catch (error) {
    return getAlchemyUrl(chainId); 
  }
}

export function getInfuraUrl(chainId) {

  let subdomain;

  switch (chainId) {
    case ETHEREUM_ID:
      subdomain = 'mainnet';
      break;
    case GOERLI_ID:
      subdomain = 'goerli';
      break;
    default:
      throw Error(`Unsupported network ${chainId}`);
  }

  return `https://${subdomain}.infura.io/v3/${REACT_APP_INFURA}`;
}

export function getAlchemyUrl(chainId) {

  let rpc = {};

  switch (chainId) {
    case POLYGON_ID:
      rpc.subdomain = 'polygon-mainnet';
      rpc.key = REACT_APP_ALCHEMY_POLYGON;
      break;
    case ARBITRUM_ID:
      rpc.subdomain = 'arb-mainnet';
      rpc.key = REACT_APP_ALCHEMY_ARBITRUM;
      break;
    default:
      throw Error(`Unsupported network ${chainId}`);
  }

  return `https://${rpc.subdomain}.g.alchemy.com/v2/${rpc.key}`;
}