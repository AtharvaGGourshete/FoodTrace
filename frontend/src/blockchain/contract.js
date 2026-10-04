import { ethers } from "ethers";
import { FOODTRACE_CONFIG } from "./config";

const FOODTRACE_ABI = [
    // =========================
    // READ FUNCTIONS
    // =========================

    "function admin() view returns (address)",

    "function getRole(address wallet) view returns (uint8)",

    "function isAuthorizedOrganization(address wallet) view returns (bool)",

    "function getOrganization(string organizationId) view returns (tuple(string organizationId,string name,address walletAddress,uint8 role,string location,bool active))",

    "function getProduct(string productId) view returns (tuple(string productId,string name,string description,string category,address manufacturer,uint256 createdAt,bool active))",

    "function getBatch(string batchId) view returns (tuple(string batchId,string productId,uint256 quantity,uint256 manufacturingDate,uint256 expiryDate,uint256 mrp,address currentOwner,uint8 status,bool recalled,string recallReason,uint256 createdAt))",

    "function getBatchHistory(string batchId) view returns (tuple(string eventType,address actor,uint256 timestamp,string location,string notes)[])",

    "function getBatchHistoryCount(string batchId) view returns (uint256)",

    "function getCurrentOwner(string batchId) view returns (address)",

    "function isBatchRecalled(string batchId) view returns (bool)",

    "function organizationIdByAddress(address) view returns (string)",

    "function roles(address) view returns (uint8)",

    "function verifyBatch(string batchId) view returns (bool valid,bool recalled,address currentOwner,uint8 status)",

    // =========================
    // WRITE FUNCTIONS
    // =========================

    "function registerOrganization(string organizationId,string name,address walletAddress,uint8 role,string location)",

    "function activateOrganization(string organizationId)",

    "function deactivateOrganization(string organizationId)",

    "function createProduct(string productId,string name,string description,string category)",

    "function activateProduct(string productId)",

    "function deactivateProduct(string productId)",

    "function createBatch(string batchId,string productId,uint256 quantity,uint256 manufacturingDate,uint256 expiryDate,uint256 mrp,string location)",

    "function transferBatch(string batchId,address newOwner,string location,string notes)",

    "function sellBatch(string batchId,address customer,string location)",

    "function recallBatch(string batchId,string reason,string location)",

    "function recordBatchEvent(string batchId,string eventType,string location,string notes)",
];

export function getReadOnlyContract() {
    const provider = new ethers.JsonRpcProvider(
        FOODTRACE_CONFIG.rpcUrl
    );

    return new ethers.Contract(
        FOODTRACE_CONFIG.contractAddress,
        FOODTRACE_ABI,
        provider
    );
}

export function getSignerContract(signer) {
    return new ethers.Contract(
        FOODTRACE_CONFIG.contractAddress,
        FOODTRACE_ABI,
        signer
    );
}

export { FOODTRACE_ABI };