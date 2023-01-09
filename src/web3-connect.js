import WalletConnect from "@walletconnect/web3-provider";
import Web3Modal from "web3modal";

const providerOptions = {
    walletconnect: {
        package: WalletConnect, 
        options: { infuraId: process.env.REACT_APP_INFURA }
    }
};

export const web3Modal = new Web3Modal({
    cacheProvider: true,
    providerOptions 
});

export async function switchChain(chainId, library) {
    await library.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: toHex(chainId) }]
    });
}

export const toHex = (num) => {
    const val = Number(num);
    return `0x${val.toString(16)}`;
};

export const web3Account = async (web3Provider) => {
    return (await web3Provider.listAccounts())[0];
}