import {
    getReadOnlyContract,
} from "./contract";

export async function testFoodTraceConnection() {
    const contract =
        getReadOnlyContract();

    const admin =
        await contract.admin();

    const product =
        await contract.getProduct(
            "P101"
        );

    const batch =
        await contract.getBatch(
            "BATCH-2026-001"
        );

    const verification =
        await contract.verifyBatch(
            "BATCH-2026-001"
        );

    console.log(
        "FoodTrace contract:",
        contract.target
    );

    console.log(
        "Admin:",
        admin
    );

    console.log(
        "Product P101:",
        product
    );

    console.log(
        "Batch BATCH-2026-001:",
        batch
    );

    console.log(
        "Verification:",
        verification
    );

    return {
        admin,
        product,
        batch,
        verification,
    };
}