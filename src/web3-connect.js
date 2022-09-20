import WalletConnect from "@walletconnect/web3-provider";
import Web3Modal from "web3modal";

const providerOptions = {
    walletconnect: {
        package: WalletConnect, 
        options: { infuraId: process.env.REACT_APP_INFURA_KEY }
    }
};

export const web3Modal = new Web3Modal({
    cacheProvider: true,
    providerOptions 
});

export const ERROR_UNKNOWN_NETWORK = 4902;