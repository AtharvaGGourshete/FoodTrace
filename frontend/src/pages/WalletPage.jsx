import { useNavigate } from "react-router-dom";

import { useWallet } from "../context/WalletContext";

const ROLE_ROUTES = {
    ADMIN: "/app/admin",
    MANUFACTURER: "/app/manufacturer",
    DISTRIBUTOR: "/app/distributor",
    RETAILER: "/app/retailer",
    CUSTOMER: "/app",
};

function shortenAddress(address) {
    if (!address) {
        return "";
    }

    return `${address.slice(
        0,
        6
    )}...${address.slice(-4)}`;
}

export default function WalletPage() {
    const navigate =
        useNavigate();

    const {
        address,
        role,
        isConnected,
        isConnecting,
        error,
        connect,
        disconnect,
    } = useWallet();

    function handleContinue() {
        if (!role) {
            return;
        }

        const route =
            ROLE_ROUTES[role.name];

        if (route) {
            navigate(route);
        }
    }

    return (
        <div className="public-page">
            <header className="public-nav">
                <div className="public-brand">
                    <span className="brand-mark">
                        F
                    </span>

                    <span>
                        FoodTrace
                    </span>
                </div>
            </header>

            <main
                className="public-section"
                style={{
                    minHeight:
                        "calc(100vh - 80px)",
                    display: "flex",
                    alignItems:
                        "center",
                    justifyContent:
                        "center",
                }}
            >
                <div
                    className="feature-card"
                    style={{
                        width:
                            "min(520px, 100%)",
                        textAlign:
                            "center",
                    }}
                >
                    <div className="eyebrow">
                        WALLET ACCESS
                    </div>

                    <h1>
                        Connect your wallet
                    </h1>

                    <p>
                        Connect your MetaMask
                        wallet to access the
                        FoodTrace application.
                    </p>

                    {!isConnected ? (
                        <button
                            className="button button-primary"
                            onClick={connect}
                            disabled={
                                isConnecting
                            }
                        >
                            {isConnecting
                                ? "Connecting..."
                                : "Connect MetaMask"}
                        </button>
                    ) : (
                        <>
                            <div
                                style={{
                                    marginTop:
                                        "34px",
                                    padding:
                                        "16px",
                                    borderRadius:
                                        "12px",
                                    background:
                                        "#f5f7fa",
                                }}
                            >
                                <div>
                                    <strong>
                                        Wallet
                                    </strong>
                                </div>

                                <code>
                                    {shortenAddress(
                                        address
                                    )}
                                </code>

                                <div
                                    style={{
                                        marginTop:
                                            "12px",
                                    }}
                                >
                                    <strong>
                                        Role
                                    </strong>

                                    <div>
                                        {role?.name}
                                    </div>
                                </div>
                            </div>

                            {role?.name ===
                                "NONE" && (
                                <p
                                    style={{
                                        marginTop:
                                            "16px",
                                    }}
                                >
                                    This wallet is
                                    not registered
                                    with FoodTrace.
                                </p>
                            )}

                            {role?.name !==
                                "NONE" && (
                                <button
                                    className="button button-primary"
                                    style={{
                                        marginTop:
                                            "20px",
                                    }}
                                    onClick={
                                        handleContinue
                                    }
                                >
                                    Continue to
                                    Dashboard
                                </button>
                            )}

                            <button
                                className="button button-secondary"
                                style={{
                                    marginTop:
                                        "12px",
                                    marginLeft: "12px",
                                }}
                                onClick={
                                    disconnect
                                }
                            >
                                Disconnect
                            </button>
                        </>
                    )}

                    {error && (
                        <p
                            style={{
                                marginTop:
                                    "16px",
                                color:
                                    "#c0392b",
                            }}
                        >
                            {error}
                        </p>
                    )}
                </div>
            </main>
        </div>
    );
}