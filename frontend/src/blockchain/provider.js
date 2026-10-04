import { ethers } from "ethers";
import { FOODTRACE_CONFIG } from "./config";

export function getReadOnlyProvider() {
    return new ethers.JsonRpcProvider(
        FOODTRACE_CONFIG.rpcUrl
    );
}

export async function getMetaMaskProvider() {
    if (!window.ethereum) {
        throw new Error(
            "MetaMask is not installed."
        );
    }

    return new ethers.BrowserProvider(
        window.ethereum
    );
}

export async function connectWallet() {
    if (!window.ethereum) {
        throw new Error(
            "MetaMask is not installed."
        );
    }

    const provider =
        new ethers.BrowserProvider(
            window.ethereum
        );

    await provider.send(
        "eth_requestAccounts",
        []
    );

    const signer =
        await provider.getSigner();

    const address =
        await signer.getAddress();

    return {
        provider,
        signer,
        address,
    };
}

export async function getConnectedWallet() {
    if (!window.ethereum) {
        return null;
    }

    const provider =
        new ethers.BrowserProvider(
            window.ethereum
        );

    const accounts =
        await provider.send(
            "eth_accounts",
            []
        );

    if (accounts.length === 0) {
        return null;
    }

    return accounts[0];
}

export async function getNetwork() {
    const provider =
        await getMetaMaskProvider();

    return provider.getNetwork();
}