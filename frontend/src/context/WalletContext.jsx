import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import {
    connectWallet,
    getConnectedWallet,
} from "../blockchain/provider";

import {
    getReadOnlyContract,
} from "../blockchain/contract";

const ROLE_NAMES = {
    0: "NONE",
    1: "ADMIN",
    2: "MANUFACTURER",
    3: "DISTRIBUTOR",
    4: "RETAILER",
    5: "CUSTOMER",
};

const WalletContext =
    createContext(null);

export function WalletProvider({ children }) {
    const [address, setAddress] =
        useState(null);

    const [role, setRole] =
        useState(null);

    const [isConnecting, setIsConnecting] =
        useState(false);

    const [error, setError] =
        useState(null);

    async function loadWallet(walletAddress) {
        try {
            const contract =
                getReadOnlyContract();

            const roleValue =
                await contract.getRole(
                    walletAddress
                );

            const roleNumber =
                Number(roleValue);

            setAddress(walletAddress);

            setRole({
                value: roleNumber,
                name:
                    ROLE_NAMES[roleNumber] ??
                    "UNKNOWN",
            });

            setError(null);
        } catch (err) {
            console.error(
                "Failed to load wallet:",
                err
            );

            setError(
                "Failed to load wallet information."
            );
        }
    }

    async function connect() {
        try {
            setIsConnecting(true);
            setError(null);

            const result =
                await connectWallet();

            await loadWallet(
                result.address
            );
        } catch (err) {
            console.error(
                "Wallet connection failed:",
                err
            );

            setError(
                err.message ||
                "Failed to connect wallet."
            );
        } finally {
            setIsConnecting(false);
        }
    }

    function disconnect() {
        setAddress(null);
        setRole(null);
        setError(null);
    }

    useEffect(() => {
        async function checkExistingWallet() {
            try {
                const wallet =
                    await getConnectedWallet();

                if (wallet) {
                    await loadWallet(wallet);
                }
            } catch (err) {
                console.error(
                    "Failed to check wallet:",
                    err
                );
            }
        }

        checkExistingWallet();

        if (!window.ethereum) {
            return;
        }

        const handleAccountsChanged =
            async (accounts) => {
                if (
                    accounts.length === 0
                ) {
                    disconnect();
                    return;
                }

                await loadWallet(
                    accounts[0]
                );
            };

        window.ethereum.on(
            "accountsChanged",
            handleAccountsChanged
        );

        return () => {
            window.ethereum.removeListener(
                "accountsChanged",
                handleAccountsChanged
            );
        };
    }, []);

    return (
        <WalletContext.Provider
            value={{
                address,
                role,
                isConnected:
                    Boolean(address),

                isConnecting,
                error,

                connect,
                disconnect,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const context =
        useContext(WalletContext);

    if (!context) {
        throw new Error(
            "useWallet must be used inside WalletProvider"
        );
    }

    return context;
}