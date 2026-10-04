import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.connect();
type SignerWithAddress = Awaited<ReturnType<typeof ethers.getSigners>>[number];

interface RoleMap {
    NONE: number;
    ADMIN: number;
    MANUFACTURER: number;
    DISTRIBUTOR: number;
    RETAILER: number;
    CUSTOMER: number;
}

interface OrganizationRecord {
    organizationId: string;
    name: string;
    walletAddress: string;
    role: number;
    location: string;
    active: boolean;
}

interface ProductRecord {
    productId: string;
    name: string;
    description: string;
    category: string;
    manufacturer: string;
    active: boolean;
}

interface BatchRecord {
    batchId: string;
    productId: string;
    quantity: bigint;
    mrp: bigint;
    currentOwner: string;
    recalled: boolean;
    recallReason?: string;
    status?: number;
}

interface BatchHistoryEntry {
    eventType: string;
    actor: string;
    location: string;
}

interface VerificationResult {
    valid: boolean;
    recalled: boolean;
    currentOwner: string;
    status: number;
}

describe("FoodTrace", function () {
    let foodTrace: any;

    let admin: SignerWithAddress;
    let manufacturer: SignerWithAddress;
    let distributor: SignerWithAddress;
    let retailer: SignerWithAddress;
    let customer: SignerWithAddress;
    let unauthorized: SignerWithAddress;

    const ROLE: RoleMap = {
        NONE: 0,
        ADMIN: 1,
        MANUFACTURER: 2,
        DISTRIBUTOR: 3,
        RETAILER: 4,
        CUSTOMER: 5
    };

    beforeEach(async function () {
        [
            admin,
            manufacturer,
            distributor,
            retailer,
            customer,
            unauthorized
        ] = await ethers.getSigners();

        const FoodTrace = await ethers.getContractFactory("FoodTrace");

        foodTrace = await FoodTrace.deploy();

        await foodTrace.waitForDeployment();
    });

    // ============================================================
    // DEPLOYMENT
    // ============================================================

    describe("Deployment", function () {

        it("should assign deployer as admin", async function () {
            expect(await foodTrace.admin())
                .to.equal(admin.address);
        });

        it("should assign ADMIN role to deployer", async function () {
            expect(
                await foodTrace.getRole(admin.address)
            ).to.equal(ROLE.ADMIN);
        });

        it("should assign NONE role to new wallets", async function () {
            expect(
                await foodTrace.getRole(unauthorized.address)
            ).to.equal(ROLE.NONE);
        });

    });

    // ============================================================
    // ORGANIZATIONS
    // ============================================================

    describe("Organization Management", function () {

        it("admin should register a manufacturer", async function () {

            await foodTrace.registerOrganization(
                "ORG-001",
                "ABC Foods",
                manufacturer.address,
                ROLE.MANUFACTURER,
                "Mumbai"
            );

            const organization =
                await foodTrace.getOrganization("ORG-001");

            expect(organization.organizationId)
                .to.equal("ORG-001");

            expect(organization.name)
                .to.equal("ABC Foods");

            expect(organization.walletAddress)
                .to.equal(manufacturer.address);

            expect(organization.role)
                .to.equal(ROLE.MANUFACTURER);

            expect(organization.location)
                .to.equal("Mumbai");

            expect(organization.active)
                .to.equal(true);
        });

        it("should assign manufacturer role to wallet", async function () {

            await foodTrace.registerOrganization(
                "ORG-001",
                "ABC Foods",
                manufacturer.address,
                ROLE.MANUFACTURER,
                "Mumbai"
            );

            expect(
                await foodTrace.getRole(manufacturer.address)
            ).to.equal(ROLE.MANUFACTURER);
        });

        it("non-admin should not register organization", async function () {

            await expect(
                foodTrace
                    .connect(manufacturer)
                    .registerOrganization(
                        "ORG-001",
                        "ABC Foods",
                        manufacturer.address,
                        ROLE.MANUFACTURER,
                        "Mumbai"
                    )
            ).to.be.revertedWith(
                "Only admin can perform this action"
            );
        });

        it("should reject duplicate organization IDs", async function () {

            await foodTrace.registerOrganization(
                "ORG-001",
                "ABC Foods",
                manufacturer.address,
                ROLE.MANUFACTURER,
                "Mumbai"
            );

            await expect(
                foodTrace.registerOrganization(
                    "ORG-001",
                    "Another Foods",
                    distributor.address,
                    ROLE.DISTRIBUTOR,
                    "Pune"
                )
            ).to.be.revertedWith(
                "Organization ID already exists"
            );
        });

        it("should deactivate an organization", async function () {

            await foodTrace.registerOrganization(
                "ORG-001",
                "ABC Foods",
                manufacturer.address,
                ROLE.MANUFACTURER,
                "Mumbai"
            );

            await foodTrace.deactivateOrganization("ORG-001");

            const organization =
                await foodTrace.getOrganization("ORG-001");

            expect(organization.active)
                .to.equal(false);

            expect(
                await foodTrace.getRole(manufacturer.address)
            ).to.equal(ROLE.NONE);
        });

    });

    // ============================================================
    // PRODUCT MANAGEMENT
    // ============================================================

    describe("Product Management", function () {

        beforeEach(async function () {

            await foodTrace.registerOrganization(
                "ORG-001",
                "ABC Foods",
                manufacturer.address,
                ROLE.MANUFACTURER,
                "Mumbai"
            );

        });

        it("manufacturer should create a product", async function () {

            await foodTrace
                .connect(manufacturer)
                .createProduct(
                    "P101",
                    "Organic Biscuits",
                    "Organic wheat biscuits",
                    "Biscuits"
                );

            const product =
                await foodTrace.getProduct("P101");

            expect(product.productId)
                .to.equal("P101");

            expect(product.name)
                .to.equal("Organic Biscuits");

            expect(product.description)
                .to.equal("Organic wheat biscuits");

            expect(product.category)
                .to.equal("Biscuits");

            expect(product.manufacturer)
                .to.equal(manufacturer.address);

            expect(product.active)
                .to.equal(true);
        });

        it("non-manufacturer should not create product", async function () {

            await expect(
                foodTrace
                    .connect(unauthorized)
                    .createProduct(
                        "P101",
                        "Organic Biscuits",
                        "Organic wheat biscuits",
                        "Biscuits"
                    )
            ).to.be.revertedWith(
                "Only manufacturer can perform this action"
            );
        });

        it("should reject duplicate product IDs", async function () {

            await foodTrace
                .connect(manufacturer)
                .createProduct(
                    "P101",
                    "Organic Biscuits",
                    "Organic wheat biscuits",
                    "Biscuits"
                );

            await expect(
                foodTrace
                    .connect(manufacturer)
                    .createProduct(
                        "P101",
                        "Another Product",
                        "Test",
                        "Test"
                    )
            ).to.be.revertedWith(
                "Product ID already exists"
            );
        });

    });

    // ============================================================
    // BATCH MANAGEMENT
    // ============================================================

    describe("Batch Management", function () {

        beforeEach(async function () {

            await foodTrace.registerOrganization(
                "ORG-001",
                "ABC Foods",
                manufacturer.address,
                ROLE.MANUFACTURER,
                "Mumbai"
            );

            await foodTrace
                .connect(manufacturer)
                .createProduct(
                    "P101",
                    "Organic Biscuits",
                    "Organic wheat biscuits",
                    "Biscuits"
                );
        });

        it("manufacturer should create a batch", async function () {

            await foodTrace
                .connect(manufacturer)
                .createBatch(
                    "BATCH-2026-001",
                    "P101",
                    5000,
                    1759276800,
                    1775001600,
                    50,
                    "Mumbai"
                );

            const batch =
                await foodTrace.getBatch(
                    "BATCH-2026-001"
                );

            expect(batch.batchId)
                .to.equal("BATCH-2026-001");

            expect(batch.productId)
                .to.equal("P101");

            expect(batch.quantity)
                .to.equal(5000);

            expect(batch.mrp)
                .to.equal(50);

            expect(batch.currentOwner)
                .to.equal(manufacturer.address);

            expect(batch.recalled)
                .to.equal(false);
        });

        it("should reject duplicate batch IDs", async function () {

            await foodTrace
                .connect(manufacturer)
                .createBatch(
                    "BATCH-2026-001",
                    "P101",
                    5000,
                    1759276800,
                    1775001600,
                    50,
                    "Mumbai"
                );

            await expect(
                foodTrace
                    .connect(manufacturer)
                    .createBatch(
                        "BATCH-2026-001",
                        "P101",
                        1000,
                        1759276800,
                        1775001600,
                        50,
                        "Mumbai"
                    )
            ).to.be.revertedWith(
                "Batch ID already exists"
            );
        });

        it("should reject zero quantity", async function () {

            await expect(
                foodTrace
                    .connect(manufacturer)
                    .createBatch(
                        "BATCH-2026-001",
                        "P101",
                        0,
                        1759276800,
                        1775001600,
                        50,
                        "Mumbai"
                    )
            ).to.be.revertedWith(
                "Quantity must be greater than zero"
            );
        });

    });

    // ============================================================
    // TRANSFERS
    // ============================================================

    describe("Batch Transfers", function () {

        beforeEach(async function () {

            await foodTrace.registerOrganization(
                "ORG-001",
                "ABC Foods",
                manufacturer.address,
                ROLE.MANUFACTURER,
                "Mumbai"
            );

            await foodTrace.registerOrganization(
                "ORG-002",
                "XYZ Distribution",
                distributor.address,
                ROLE.DISTRIBUTOR,
                "Pune"
            );

            await foodTrace.registerOrganization(
                "ORG-003",
                "Retail Mart",
                retailer.address,
                ROLE.RETAILER,
                "Thane"
            );

            await foodTrace
                .connect(manufacturer)
                .createProduct(
                    "P101",
                    "Organic Biscuits",
                    "Organic wheat biscuits",
                    "Biscuits"
                );

            await foodTrace
                .connect(manufacturer)
                .createBatch(
                    "BATCH-2026-001",
                    "P101",
                    5000,
                    1759276800,
                    1775001600,
                    50,
                    "Mumbai"
                );
        });

        it("manufacturer should transfer batch to distributor", async function () {

            await foodTrace
                .connect(manufacturer)
                .transferBatch(
                    "BATCH-2026-001",
                    distributor.address,
                    "Pune",
                    "Transferred to distributor"
                );

            const batch =
                await foodTrace.getBatch(
                    "BATCH-2026-001"
                );

            expect(batch.currentOwner)
                .to.equal(distributor.address);
        });

        it("distributor should transfer batch to retailer", async function () {

            await foodTrace
                .connect(manufacturer)
                .transferBatch(
                    "BATCH-2026-001",
                    distributor.address,
                    "Pune",
                    "Transferred to distributor"
                );

            await foodTrace
                .connect(distributor)
                .transferBatch(
                    "BATCH-2026-001",
                    retailer.address,
                    "Thane",
                    "Transferred to retailer"
                );

            const batch =
                await foodTrace.getBatch(
                    "BATCH-2026-001"
                );

            expect(batch.currentOwner)
                .to.equal(retailer.address);
        });

        it("non-owner should not transfer batch", async function () {

            await expect(
                foodTrace
                    .connect(unauthorized)
                    .transferBatch(
                        "BATCH-2026-001",
                        distributor.address,
                        "Pune",
                        "Unauthorized transfer"
                    )
            ).to.be.revertedWith(
                "Only current owner can transfer batch"
            );
        });

        it("should reject transfer to unauthorized wallet", async function () {

            await expect(
                foodTrace
                    .connect(manufacturer)
                    .transferBatch(
                        "BATCH-2026-001",
                        unauthorized.address,
                        "Pune",
                        "Invalid transfer"
                    )
            ).to.be.revertedWith(
                "New owner is not authorized"
            );
        });

    });

    // ============================================================
    // BATCH HISTORY
    // ============================================================

    describe("Batch History", function () {

        beforeEach(async function () {

            await foodTrace.registerOrganization(
                "ORG-001",
                "ABC Foods",
                manufacturer.address,
                ROLE.MANUFACTURER,
                "Mumbai"
            );

            await foodTrace.registerOrganization(
                "ORG-002",
                "XYZ Distribution",
                distributor.address,
                ROLE.DISTRIBUTOR,
                "Pune"
            );

            await foodTrace
                .connect(manufacturer)
                .createProduct(
                    "P101",
                    "Organic Biscuits",
                    "Organic wheat biscuits",
                    "Biscuits"
                );

            await foodTrace
                .connect(manufacturer)
                .createBatch(
                    "BATCH-2026-001",
                    "P101",
                    5000,
                    1759276800,
                    1775001600,
                    50,
                    "Mumbai"
                );
        });

        it("should record batch creation in history", async function () {

            const history =
                await foodTrace.getBatchHistory(
                    "BATCH-2026-001"
                );

            expect(history.length)
                .to.equal(1);

            expect(history[0].eventType)
                .to.equal("BATCH_CREATED");

            expect(history[0].actor)
                .to.equal(manufacturer.address);

            expect(history[0].location)
                .to.equal("Mumbai");
        });

        it("should record transfers in history", async function () {

            await foodTrace
                .connect(manufacturer)
                .transferBatch(
                    "BATCH-2026-001",
                    distributor.address,
                    "Pune",
                    "Transferred to distributor"
                );

            const history =
                await foodTrace.getBatchHistory(
                    "BATCH-2026-001"
                );

            expect(history.length)
                .to.equal(2);

            expect(history[1].eventType)
                .to.equal("BATCH_TRANSFERRED");

            expect(history[1].actor)
                .to.equal(manufacturer.address);

            expect(history[1].location)
                .to.equal("Pune");
        });

    });

    // ============================================================
    // RECALL
    // ============================================================

    describe("Batch Recall", function () {

        beforeEach(async function () {

            await foodTrace.registerOrganization(
                "ORG-001",
                "ABC Foods",
                manufacturer.address,
                ROLE.MANUFACTURER,
                "Mumbai"
            );

            await foodTrace
                .connect(manufacturer)
                .createProduct(
                    "P101",
                    "Organic Biscuits",
                    "Organic wheat biscuits",
                    "Biscuits"
                );

            await foodTrace
                .connect(manufacturer)
                .createBatch(
                    "BATCH-2026-001",
                    "P101",
                    5000,
                    1759276800,
                    1775001600,
                    50,
                    "Mumbai"
                );
        });

        it("manufacturer should recall a batch", async function () {

            await foodTrace
                .connect(manufacturer)
                .recallBatch(
                    "BATCH-2026-001",
                    "Contamination detected",
                    "Mumbai"
                );

            const batch =
                await foodTrace.getBatch(
                    "BATCH-2026-001"
                );

            expect(batch.recalled)
                .to.equal(true);

            expect(batch.recallReason)
                .to.equal("Contamination detected");

            expect(batch.status)
                .to.equal(2);
        });

        it("unauthorized user should not recall batch", async function () {

            await expect(
                foodTrace
                    .connect(unauthorized)
                    .recallBatch(
                        "BATCH-2026-001",
                        "Fake recall",
                        "Mumbai"
                    )
            ).to.be.revertedWith(
                "Not authorized to recall"
            );
        });

        it("recalled batch should not be transferable", async function () {

            await foodTrace
                .connect(manufacturer)
                .recallBatch(
                    "BATCH-2026-001",
                    "Contamination detected",
                    "Mumbai"
                );

            await foodTrace.registerOrganization(
                "ORG-002",
                "XYZ Distribution",
                distributor.address,
                ROLE.DISTRIBUTOR,
                "Pune"
            );

            await expect(
                foodTrace
                    .connect(manufacturer)
                    .transferBatch(
                        "BATCH-2026-001",
                        distributor.address,
                        "Pune",
                        "Transfer recalled batch"
                    )
            ).to.be.revertedWith(
                "Recalled batch cannot be transferred"
            );
        });

    });

    // ============================================================
    // VERIFICATION
    // ============================================================

    describe("Batch Verification", function () {

        beforeEach(async function () {

            await foodTrace.registerOrganization(
                "ORG-001",
                "ABC Foods",
                manufacturer.address,
                ROLE.MANUFACTURER,
                "Mumbai"
            );

            await foodTrace
                .connect(manufacturer)
                .createProduct(
                    "P101",
                    "Organic Biscuits",
                    "Organic wheat biscuits",
                    "Biscuits"
                );

            await foodTrace
                .connect(manufacturer)
                .createBatch(
                    "BATCH-2026-001",
                    "P101",
                    5000,
                    1759276800,
                    1775001600,
                    50,
                    "Mumbai"
                );
        });

        it("should verify a valid batch", async function () {

            const result =
                await foodTrace.verifyBatch(
                    "BATCH-2026-001"
                );

            expect(result.valid)
                .to.equal(true);

            expect(result.recalled)
                .to.equal(false);

            expect(result.currentOwner)
                .to.equal(manufacturer.address);

            expect(result.status)
                .to.equal(0);
        });

        it("should correctly report recalled batch", async function () {

            await foodTrace
                .connect(manufacturer)
                .recallBatch(
                    "BATCH-2026-001",
                    "Contamination detected",
                    "Mumbai"
                );

            const result =
                await foodTrace.verifyBatch(
                    "BATCH-2026-001"
                );

            expect(result.valid)
                .to.equal(true);

            expect(result.recalled)
                .to.equal(true);

            expect(result.status)
                .to.equal(2);
        });

    });

});