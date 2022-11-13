import WalletConnect from "@walletconnect/web3-provider";
import Web3Modal from "web3modal";

const providerOptions = {
    walletconnect: {
        package: WalletConnect, 
        options: { infuraId: process.env.REACT_APP_INFURA }
    }
};

export const web3Modal = new Web3Modal({
    cacheProvider: false,
    providerOptions 
});

export async function switchChain(chainId, library) {
    await library.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: toHex(chainId) }]
    });
}

export const toHex = (num) => {
    const val = Number(num);
    return `0x${val.toString(16)}`;
};