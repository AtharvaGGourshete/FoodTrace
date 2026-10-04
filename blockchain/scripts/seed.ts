import hre from "hardhat";
import fs from "node:fs";
import path from "node:path";

async function main() {
    const { ethers } = await hre.network.getOrCreate();

    // ------------------------------------------------------------
    // Load deployment
    // ------------------------------------------------------------

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
        fs.readFileSync(deploymentPath, "utf-8")
    );

    const FoodTrace = await ethers.getContractFactory(
        "FoodTrace"
    );

    const foodTrace = FoodTrace.attach(
        deployment.address
    );

    console.log("Connected to FoodTrace:");
    console.log(deployment.address);

    // ------------------------------------------------------------
    // Ganache accounts
    // ------------------------------------------------------------

    const accounts = await ethers.getSigners();

    const [
        admin,
        manufacturer,
        distributor,
        retailer,
        customer,
    ] = accounts;

    console.log("\nWallets");
    console.log("---------------------------------");
    console.log("Admin:        ", admin.address);
    console.log("Manufacturer: ", manufacturer.address);
    console.log("Distributor:  ", distributor.address);
    console.log("Retailer:     ", retailer.address);
    console.log("Customer:     ", customer.address);

    // ------------------------------------------------------------
    // Roles
    // ------------------------------------------------------------

    const MANUFACTURER = 2;
    const DISTRIBUTOR = 3;
    const RETAILER = 4;

    // ------------------------------------------------------------
    // 1. Register organizations
    // ------------------------------------------------------------

    console.log("\nRegistering organizations...");

    await (
        await foodTrace.registerOrganization(
            "ORG-001",
            "ABC Foods",
            manufacturer.address,
            MANUFACTURER,
            "Mumbai"
        )
    ).wait();

    console.log("✓ ORG-001 → ABC Foods");

    await (
        await foodTrace.registerOrganization(
            "ORG-002",
            "XYZ Distribution",
            distributor.address,
            DISTRIBUTOR,
            "Pune"
        )
    ).wait();

    console.log("✓ ORG-002 → XYZ Distribution");

    await (
        await foodTrace.registerOrganization(
            "ORG-003",
            "Retail Mart",
            retailer.address,
            RETAILER,
            "Thane"
        )
    ).wait();

    console.log("✓ ORG-003 → Retail Mart");

    // ------------------------------------------------------------
    // 2. Create products
    // ------------------------------------------------------------

    console.log("\nCreating products...");

    await (
        await foodTrace
            .connect(manufacturer)
            .createProduct(
                "P101",
                "Organic Biscuits",
                "Organic wheat biscuits",
                "Biscuits"
            )
    ).wait();

    console.log("✓ P101 → Organic Biscuits");

    await (
        await foodTrace
            .connect(manufacturer)
            .createProduct(
                "P102",
                "Mango Juice",
                "Natural mango fruit juice",
                "Beverages"
            )
    ).wait();

    console.log("✓ P102 → Mango Juice");

    await (
        await foodTrace
            .connect(manufacturer)
            .createProduct(
                "P103",
                "Tomato Ketchup",
                "Tomato based ketchup",
                "Condiments"
            )
    ).wait();

    console.log("✓ P103 → Tomato Ketchup");

    // ------------------------------------------------------------
    // Dates
    // ------------------------------------------------------------

    const now = Math.floor(Date.now() / 1000);

    const day = 24 * 60 * 60;

    // ------------------------------------------------------------
    // 3. Create batches
    // ------------------------------------------------------------

    console.log("\nCreating batches...");

    await (
        await foodTrace
            .connect(manufacturer)
            .createBatch(
                "BATCH-2026-001",
                "P101",
                5000,
                now - 10 * day,
                now + 180 * day,
                50,
                "Mumbai"
            )
    ).wait();

    console.log("✓ BATCH-2026-001");

    await (
        await foodTrace
            .connect(manufacturer)
            .createBatch(
                "BATCH-2026-002",
                "P102",
                3000,
                now - 8 * day,
                now + 150 * day,
                80,
                "Mumbai"
            )
    ).wait();

    console.log("✓ BATCH-2026-002");

    await (
        await foodTrace
            .connect(manufacturer)
            .createBatch(
                "BATCH-2026-003",
                "P103",
                4000,
                now - 5 * day,
                now + 200 * day,
                120,
                "Mumbai"
            )
    ).wait();

    console.log("✓ BATCH-2026-003");

    await (
        await foodTrace
            .connect(manufacturer)
            .createBatch(
                "BATCH-2026-004",
                "P101",
                2500,
                now - 3 * day,
                now + 187 * day,
                50,
                "Mumbai"
            )
    ).wait();

    console.log("✓ BATCH-2026-004");

    // ------------------------------------------------------------
    // 4. Transfer BATCH-2026-001
    // Manufacturer → Distributor
    // ------------------------------------------------------------

    console.log("\nTransferring BATCH-2026-001...");

    await (
        await foodTrace
            .connect(manufacturer)
            .transferBatch(
                "BATCH-2026-001",
                distributor.address,
                "Pune",
                "Shipment received by distributor"
            )
    ).wait();

    console.log(
        "✓ Manufacturer → Distributor"
    );

    // ------------------------------------------------------------
    // 5. Transfer BATCH-2026-001
    // Distributor → Retailer
    // ------------------------------------------------------------

    await (
        await foodTrace
            .connect(distributor)
            .transferBatch(
                "BATCH-2026-001",
                retailer.address,
                "Thane",
                "Shipment received by retailer"
            )
    ).wait();

    console.log(
        "✓ Distributor → Retailer"
    );

    // ------------------------------------------------------------
    // 6. Transfer BATCH-2026-002
    // Manufacturer → Distributor
    // ------------------------------------------------------------

    await (
        await foodTrace
            .connect(manufacturer)
            .transferBatch(
                "BATCH-2026-002",
                distributor.address,
                "Pune",
                "Mango juice shipment dispatched"
            )
    ).wait();

    console.log(
        "✓ BATCH-2026-002 → Distributor"
    );

    // ------------------------------------------------------------
    // 7. Transfer BATCH-2026-003
    // Manufacturer → Distributor → Retailer
    // ------------------------------------------------------------

    await (
        await foodTrace
            .connect(manufacturer)
            .transferBatch(
                "BATCH-2026-003",
                distributor.address,
                "Pune",
                "Ketchup shipment dispatched"
            )
    ).wait();

    await (
        await foodTrace
            .connect(distributor)
            .transferBatch(
                "BATCH-2026-003",
                retailer.address,
                "Thane",
                "Ketchup shipment received"
            )
    ).wait();

    console.log(
        "✓ BATCH-2026-003 → Distributor → Retailer"
    );

    // ------------------------------------------------------------
    // 8. Add additional batch event
    // ------------------------------------------------------------

    await (
        await foodTrace
            .connect(retailer)
            .recordBatchEvent(
                "BATCH-2026-001",
                "QUALITY_CHECK",
                "Thane",
                "Quality inspection completed successfully"
            )
    ).wait();

    console.log(
        "✓ Quality check recorded for BATCH-2026-001"
    );

    // ------------------------------------------------------------
    // 9. Display final state
    // ------------------------------------------------------------

    console.log("\n=================================");
    console.log("FoodTrace seed completed");
    console.log("=================================");

    console.log(
        "\nBATCH-2026-001 current owner:",
        await foodTrace.getCurrentOwner(
            "BATCH-2026-001"
        )
    );

    console.log(
        "BATCH-2026-001 history entries:",
        (
            await foodTrace.getBatchHistoryCount(
                "BATCH-2026-001"
            )
        ).toString()
    );

    console.log(
        "\nBATCH-2026-002 current owner:",
        await foodTrace.getCurrentOwner(
            "BATCH-2026-002"
        )
    );

    console.log(
        "BATCH-2026-003 current owner:",
        await foodTrace.getCurrentOwner(
            "BATCH-2026-003"
        )
    );

    console.log(
        "BATCH-2026-004 current owner:",
        await foodTrace.getCurrentOwner(
            "BATCH-2026-004"
        )
    );

    console.log("\nCustomer wallet:");
    console.log(customer.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});