import hre from "hardhat";
import fs from "node:fs";
import path from "node:path";

async function main() {
    const { ethers } = await hre.network.getOrCreate();

    console.log("Deploying FoodTrace...");

    const FoodTrace = await ethers.getContractFactory("FoodTrace");

    const foodTrace = await FoodTrace.deploy();

    await foodTrace.waitForDeployment();

    const address = await foodTrace.getAddress();

    const network = await ethers.provider.getNetwork();

    const deploymentData = {
        contractName: "FoodTrace",
        address,
        chainId: network.chainId.toString(),
        deployedAt: new Date().toISOString(),
        abi: FoodTrace.interface.formatJson(),
    };

    const deploymentsDir = path.join(
        process.cwd(),
        "deployments"
    );

    fs.mkdirSync(deploymentsDir, {
        recursive: true,
    });

    const deploymentFile = path.join(
        deploymentsDir,
        "ganache.json"
    );

    fs.writeFileSync(
        deploymentFile,
        JSON.stringify(deploymentData, null, 2)
    );

    console.log("=================================");
    console.log("FoodTrace deployed successfully");
    console.log("Contract address:", address);
    console.log("Chain ID:", network.chainId.toString());
    console.log("Deployment file:", deploymentFile);
    console.log("=================================");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});