import { ETHEREUM_ID, POLYGON_ID, ARBITRUM_ID, GOERLI_ID, GNOSIS_ID } from "../networks";

const {
  REACT_APP_INFURA,
  REACT_APP_ALCHEMY_POLYGON,
  REACT_APP_ALCHEMY_ARBITRUM,
  REACT_APP_MAINNET_FORK,
  NODE_ENV
} = process.env;

const LOCAL_RPC = 'http://127.0.0.1:8545';
const GNOSIS_RPC = 'https://rpc.gnosischain.com';

export function getRpcUrl(chainId) {
  if (NODE_ENV === 'development' 
      && REACT_APP_MAINNET_FORK === 'true'
      && ETHEREUM_ID === chainId) {
    console.log('Using local RPC', LOCAL_RPC);
    return LOCAL_RPC;
  }
  if (GNOSIS_ID === chainId) return GNOSIS_RPC;
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
    case POLYGON_ID:
      subdomain = 'polygon-mainnet';
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