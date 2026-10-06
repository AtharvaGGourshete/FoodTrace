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

const DISCONNECTED_KEY =
    "foodtrace_wallet_disconnected";

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

            // User explicitly clicked Connect,
            // so allow a new MetaMask account selection.
            sessionStorage.removeItem(
                DISCONNECTED_KEY
            );

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
        // Disconnect from FoodTrace.
        //
        // This does NOT disconnect MetaMask itself.
        // MetaMask remains installed/connected,
        // but FoodTrace will no longer restore
        // the wallet automatically.
        setAddress(null);
        setRole(null);
        setError(null);

        sessionStorage.setItem(
            DISCONNECTED_KEY,
            "true"
        );
    }

    useEffect(() => {
        async function checkExistingWallet() {
            try {
                // If the user previously clicked
                // FoodTrace Disconnect, do not
                // automatically reconnect on refresh.
                const wasDisconnected =
                    sessionStorage.getItem(
                        DISCONNECTED_KEY
                    ) === "true";

                if (wasDisconnected) {
                    return;
                }

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

                // If FoodTrace was explicitly
                // disconnected, don't automatically
                // log the new MetaMask account in.
                const wasDisconnected =
                    sessionStorage.getItem(
                        DISCONNECTED_KEY
                    ) === "true";

                if (wasDisconnected) {
                    return;
                }

                // Normal account switching while
                // FoodTrace is connected.
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