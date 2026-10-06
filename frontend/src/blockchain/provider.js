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

    /*
     * Ask MetaMask to open its account/permission
     * selection UI.
     *
     * This is important because using only
     * eth_requestAccounts can reuse the account
     * that is already connected to the site.
     */
    await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [
            {
                eth_accounts: {},
            },
        ],
    });

    const provider =
        new ethers.BrowserProvider(
            window.ethereum
        );

    /*
     * Get the accounts currently selected/allowed
     * for FoodTrace by MetaMask.
     */
    const accounts =
        await provider.send(
            "eth_accounts",
            []
        );

    if (accounts.length === 0) {
        throw new Error(
            "No MetaMask account was selected."
        );
    }

    /*
     * MetaMask places the selected account first.
     */
    const selectedAddress =
        accounts[0];

    const signer =
        await provider.getSigner(
            selectedAddress
        );

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