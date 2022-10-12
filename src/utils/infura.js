import { ETHEREUM_ID, GOERLI_ID } from "../networks";

const { REACT_APP_INFURA_KEY } = process.env;

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

  return `https://${subdomain}.infura.io/v3/${REACT_APP_INFURA_KEY}`;
}