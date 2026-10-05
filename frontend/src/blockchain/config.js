export const FOODTRACE_CONFIG = {
    contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS,

    chainId: 1337,

    rpcUrl:
        import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545",
};