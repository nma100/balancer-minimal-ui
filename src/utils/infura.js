import { ETHEREUM_ID, GOERLI_ID } from "../networks";

export function getInfuraUrl(chainId) {

  let url;

  switch (chainId) {
      case ETHEREUM_ID:
        url = 'https://mainnet.infura.io/v3/';
        break;
      case GOERLI_ID:
        url = 'https://goerli.infura.io/v3/';
        break;
      default:
        throw Error(`Unsupported network ${chainId}`);
    }

  return `${url}${process.env.REACT_APP_INFURA_KEY}`;
}