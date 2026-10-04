import hre from "hardhat";
import fs from "node:fs";
import path from "node:path";

async function main() {
    const { ethers } = await hre.network.getOrCreate();

    // Load deployment information
    const deploymentPath = path.join(
        process.cwd(),
        "deployments",
        "ganache.json"
    );

    if (!fs.existsSync(deploymentPath)) {
        throw new Error(
            "Deployment file not found. Run deploy.ts first."
        );
    }

    const deployment = JSON.parse(
        fs.readFileSync(deploymentPath, "utf8")
    );

    const FoodTrace = await ethers.getContractFactory("FoodTrace");

    const foodTrace = FoodTrace.attach(
        deployment.address
    );

    console.log("=================================");
    console.log("FoodTrace Blockchain Verification");
    console.log("=================================");

    console.log("Contract:", deployment.address);
    console.log("Chain ID:", deployment.chainId);

    // --------------------------------------------------
    // 1. Verify Admin
    // --------------------------------------------------

    const [signer] = await ethers.getSigners();
    const signerAddress = await signer.getAddress();

    const role = await foodTrace.getRole(signerAddress);

    console.log("\n--- ADMIN ---");
    console.log("Signer:", signerAddress);
    console.log("Role:", role.toString());

    // --------------------------------------------------
    // 2. Verify Organizations
    // --------------------------------------------------

    console.log("\n--- ORGANIZATIONS ---");

    const organizations = [
        {
            id: "ORG-001",
            name: "ABC Foods",
        },
        {
            id: "ORG-002",
            name: "XYZ Distribution",
        },
        {
            id: "ORG-003",
            name: "Retail Mart",
        },
    ];

    for (const org of organizations) {
        const data = await foodTrace.getOrganization(org.id);

        console.log(`${org.id}:`);
        console.log("  Name:", data.name);
        console.log("  Wallet:", data.walletAddress);
        console.log("  Role:", data.role.toString());
        console.log("  Location:", data.location);
        console.log("  Active:", data.active);
    }

    // --------------------------------------------------
    // 3. Verify Products
    // --------------------------------------------------

    console.log("\n--- PRODUCTS ---");

    const products = [
        "P101",
        "P102",
        "P103",
    ];

    for (const productId of products) {
        const product = await foodTrace.getProduct(productId);

        console.log(`${productId}:`);
        console.log("  Name:", product.name);
        console.log("  Description:", product.description);
        console.log("  Category:", product.category);
        console.log("  Manufacturer:", product.manufacturer);
        console.log("  Active:", product.active);
    }

    // --------------------------------------------------
    // 4. Verify Batches
    // --------------------------------------------------

    console.log("\n--- BATCHES ---");

    const batches = [
        "BATCH-2026-001",
        "BATCH-2026-002",
        "BATCH-2026-003",
        "BATCH-2026-004",
    ];

    for (const batchId of batches) {
        const batch = await foodTrace.getBatch(batchId);

        console.log(`${batchId}:`);
        console.log("  Product:", batch.productId);
        console.log("  Quantity:", batch.quantity.toString());
        console.log("  MRP:", batch.mrp.toString());
        console.log("  Current Owner:", batch.currentOwner);
        console.log("  Status:", batch.status.toString());
        console.log("  Recalled:", batch.recalled);
    }

    // --------------------------------------------------
    // 5. Verify Batch History
    // --------------------------------------------------

    console.log("\n--- BATCH HISTORY ---");

    const historyBatch = "BATCH-2026-001";

    const historyCount =
        await foodTrace.getBatchHistoryCount(historyBatch);

    console.log(
        `${historyBatch} history entries:`,
        historyCount.toString()
    );

    const history =
        await foodTrace.getBatchHistory(historyBatch);

    for (let i = 0; i < history.length; i++) {
        const event = history[i];

        console.log(`\nEvent ${i + 1}:`);
        console.log("  Type:", event.eventType);
        console.log("  Actor:", event.actor);
        console.log(
            "  Timestamp:",
            new Date(
                Number(event.timestamp) * 1000
            ).toISOString()
        );
        console.log("  Location:", event.location);
        console.log("  Notes:", event.notes);
    }

    // --------------------------------------------------
    // 6. Verify Batch Verification Function
    // --------------------------------------------------

    console.log("\n--- VERIFICATION ---");

    for (const batchId of batches) {
        const [
            valid,
            recalled,
            currentOwner,
            status,
        ] = await foodTrace.verifyBatch(batchId);

        console.log(`${batchId}:`);

        console.log("  Valid:", valid);
        console.log("  Recalled:", recalled);
        console.log("  Current Owner:", currentOwner);
        console.log("  Status:", status.toString());
    }

    // --------------------------------------------------
    // 7. Verify Current Owners
    // --------------------------------------------------

    console.log("\n--- CURRENT OWNERS ---");

    for (const batchId of batches) {
        const owner =
            await foodTrace.getCurrentOwner(batchId);

        console.log(
            `${batchId} → ${owner}`
        );
    }

    console.log("\n=================================");
    console.log("Blockchain verification complete");
    console.log("=================================");
}

main().catch((error) => {
    console.error("\nVerification failed:");
    console.error(error);
    process.exitCode = 1;
});