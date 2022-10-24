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

export const toHex = (num) => {
    const val = Number(num);
    return "0x" + val.toString(16);
};

export async function switchChain(chainId, library) {
    try {
        await library.provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: toHex(chainId) }]
        });
    } catch (switchError) {
        if (switchError.code === UNRECOGNIZED_CHAIN) {
            // TODO : Popup error
        }
        console.error(switchError);
    }
}

export const UNRECOGNIZED_CHAIN  = 4902;