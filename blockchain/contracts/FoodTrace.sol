// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract FoodTrace {
    // ENUMS

    enum Role {
        NONE,
        ADMIN,
        MANUFACTURER,
        DISTRIBUTOR,
        RETAILER,
        CUSTOMER
    }

    enum BatchStatus {
        ACTIVE,
        SOLD,
        RECALLED,
        IN_TRANSIT,
        DELIVERED
    }

    // STRUCTS

    struct Organization {
        string organizationId;
        string name;
        address walletAddress;
        Role role;
        string location;
        bool active;
    }

    struct Product {
        string productId;
        string name;
        string description;
        string category;
        address manufacturer;
        uint256 createdAt;
        bool active;
    }

    struct Batch {
        string batchId;
        string productId;
        uint256 quantity;
        uint256 manufacturingDate;
        uint256 expiryDate;
        uint256 mrp;
        address currentOwner;
        BatchStatus status;
        bool recalled;
        string recallReason;
        uint256 createdAt;
    }

    struct BatchEvent {
        string eventType;
        address actor;
        uint256 timestamp;
        string location;
        string notes;
    }

    // STATE VARIABLES

    address public admin;

    mapping(address => Role) public roles;

    mapping(string => Organization) private organizations;
    mapping(address => string) public organizationIdByAddress;

    mapping(string => Product) private products;

    mapping(string => Batch) private batches;

    mapping(string => BatchEvent[]) private batchHistory;

    // Used to prevent duplicate IDs
    mapping(string => bool) private productExists;
    mapping(string => bool) private batchExists;
    mapping(string => bool) private organizationExists;

    // Enumeration indexes used by the frontend.
    string[] private organizationIds;
    string[] private productIds;
    string[] private batchIds;
    mapping(string => string[]) private productBatchIds;

    // Number of batches currently owned by each wallet.
    mapping(address => uint256) public ownedBatchCount;

    // EVENTS

    event OrganizationRegistered(
        string indexed organizationId,
        string name,
        address indexed walletAddress,
        Role role
    );

    event OrganizationStatusChanged(
        string indexed organizationId,
        bool active
    );

    event ProductCreated(
        string indexed productId,
        string name,
        address indexed manufacturer
    );

    event ProductStatusChanged(
        string indexed productId,
        bool active
    );

    event BatchCreated(
        string indexed batchId,
        string indexed productId,
        address indexed manufacturer
    );

    event BatchTransferred(
        string indexed batchId,
        address indexed from,
        address indexed to
    );

    event BatchRecalled(
        string indexed batchId,
        address indexed recalledBy,
        string reason
    );

    event BatchSold(
        string indexed batchId,
        address indexed retailer,
        address indexed customer
    );

    event BatchEventRecorded(
        string indexed batchId,
        string eventType,
        address indexed actor
    );

    // MODIFIERS

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyManufacturer() {
        require(
            roles[msg.sender] == Role.MANUFACTURER,
            "Only manufacturer can perform this action"
        );
        _;
    }

    modifier onlyDistributor() {
        require(
            roles[msg.sender] == Role.DISTRIBUTOR,
            "Only distributor can perform this action"
        );
        _;
    }

    modifier onlyRetailer() {
        require(
            roles[msg.sender] == Role.RETAILER,
            "Only retailer can perform this action"
        );
        _;
    }

    modifier onlyAuthorizedOrganization() {
        require(
            roles[msg.sender] == Role.MANUFACTURER ||
            roles[msg.sender] == Role.DISTRIBUTOR ||
            roles[msg.sender] == Role.RETAILER,
            "Unauthorized organization"
        );
        _;
    }

    modifier batchMustExist(string memory batchId) {
        require(batchExists[batchId], "Batch does not exist");
        _;
    }

    modifier productMustExist(string memory productId) {
        require(productExists[productId], "Product does not exist");
        _;
    }

    // CONSTRUCTOR

    constructor() {
        admin = msg.sender;
        roles[msg.sender] = Role.ADMIN;
    }

    // ROLE MANAGEMENT

    function getRole(address wallet) external view returns (Role) {
        return roles[wallet];
    }

    function isAuthorizedOrganization(
        address wallet
    ) public view returns (bool) {
        Role role = roles[wallet];

        return (
            role == Role.MANUFACTURER ||
            role == Role.DISTRIBUTOR ||
            role == Role.RETAILER
        );
    }


    // ORGANIZATION MANAGEMENT

    function registerOrganization(
        string memory organizationId,
        string memory name,
        address walletAddress,
        Role role,
        string memory location
    ) external onlyAdmin {
        require(
            !organizationExists[organizationId],
            "Organization ID already exists"
        );

        require(
            walletAddress != address(0),
            "Invalid wallet address"
        );

        require(
            role == Role.MANUFACTURER ||
            role == Role.DISTRIBUTOR ||
            role == Role.RETAILER,
            "Invalid organization role"
        );

        require(
            roles[walletAddress] == Role.NONE,
            "Wallet already has a role"
        );

        organizations[organizationId] = Organization({
            organizationId: organizationId,
            name: name,
            walletAddress: walletAddress,
            role: role,
            location: location,
            active: true
        });

        organizationExists[organizationId] = true;
        organizationIds.push(organizationId);
        organizationIdByAddress[walletAddress] = organizationId;
        roles[walletAddress] = role;

        emit OrganizationRegistered(
            organizationId,
            name,
            walletAddress,
            role
        );
    }

    function deactivateOrganization(
        string memory organizationId
    ) external onlyAdmin {
        require(
            organizationExists[organizationId],
            "Organization does not exist"
        );

        Organization storage organization = organizations[organizationId];

        organization.active = false;
        roles[organization.walletAddress] = Role.NONE;

        emit OrganizationStatusChanged(
            organizationId,
            false
        );
    }

    function activateOrganization(
        string memory organizationId
    ) external onlyAdmin {
        require(
            organizationExists[organizationId],
            "Organization does not exist"
        );

        Organization storage organization = organizations[organizationId];

        organization.active = true;
        roles[organization.walletAddress] = organization.role;

        emit OrganizationStatusChanged(
            organizationId,
            true
        );
    }

    function getOrganization(
        string memory organizationId
    )
        external
        view
        returns (Organization memory)
    {
        require(
            organizationExists[organizationId],
            "Organization does not exist"
        );

        return organizations[organizationId];
    }

    function getOrganizationIds()
        external
        view
        returns (string[] memory)
    {
        return organizationIds;
    }

    function getOrganizationBatchCount(
        address wallet
    )
        external
        view
        returns (uint256)
    {
        return ownedBatchCount[wallet];
    }

    // PRODUCT MANAGEMENT

    function createProduct(
        string memory productId,
        string memory name,
        string memory description,
        string memory category
    ) external onlyManufacturer {
        require(
            !productExists[productId],
            "Product ID already exists"
        );

        string memory organizationId =
            organizationIdByAddress[msg.sender];

        require(
            organizations[organizationId].active,
            "Manufacturer organization is inactive"
        );

        products[productId] = Product({
            productId: productId,
            name: name,
            description: description,
            category: category,
            manufacturer: msg.sender,
            createdAt: block.timestamp,
            active: true
        });

        productExists[productId] = true;
        productIds.push(productId);

        emit ProductCreated(
            productId,
            name,
            msg.sender
        );
    }

    function deactivateProduct(
        string memory productId
    )
        external
        productMustExist(productId)
    {
        Product storage product = products[productId];

        require(
            product.manufacturer == msg.sender ||
            msg.sender == admin,
            "Not authorized"
        );

        product.active = false;

        emit ProductStatusChanged(
            productId,
            false
        );
    }

    function activateProduct(
        string memory productId
    )
        external
        productMustExist(productId)
    {
        Product storage product = products[productId];

        require(
            product.manufacturer == msg.sender ||
            msg.sender == admin,
            "Not authorized"
        );

        product.active = true;

        emit ProductStatusChanged(
            productId,
            true
        );
    }

    function getProduct(
        string memory productId
    )
        external
        view
        productMustExist(productId)
        returns (Product memory)
    {
        return products[productId];
    }

    function getProductIds()
        external
        view
        returns (string[] memory)
    {
        return productIds;
    }


    // BATCH MANAGEMENT

    function createBatch(
        string memory batchId,
        string memory productId,
        uint256 quantity,
        uint256 manufacturingDate,
        uint256 expiryDate,
        uint256 mrp,
        string memory location
    )
        external
        onlyManufacturer
        productMustExist(productId)
    {
        require(
            !batchExists[batchId],
            "Batch ID already exists"
        );

        require(
            quantity > 0,
            "Quantity must be greater than zero"
        );

        require(
            expiryDate > manufacturingDate,
            "Invalid expiry date"
        );

        Product memory product = products[productId];

        require(
            product.manufacturer == msg.sender,
            "Only product manufacturer can create batch"
        );

        require(
            product.active,
            "Product is inactive"
        );

        batches[batchId] = Batch({
            batchId: batchId,
            productId: productId,
            quantity: quantity,
            manufacturingDate: manufacturingDate,
            expiryDate: expiryDate,
            mrp: mrp,
            currentOwner: msg.sender,
            status: BatchStatus.ACTIVE,
            recalled: false,
            recallReason: "",
            createdAt: block.timestamp
        });

        batchExists[batchId] = true;
        batchIds.push(batchId);
        productBatchIds[productId].push(batchId);
        ownedBatchCount[msg.sender] += 1;

        _recordBatchEvent(
            batchId,
            "BATCH_CREATED",
            location,
            "Batch manufactured"
        );

        emit BatchCreated(
            batchId,
            productId,
            msg.sender
        );
    }

    function getBatch(
        string memory batchId
    )
        external
        view
        batchMustExist(batchId)
        returns (Batch memory)
    {
        return batches[batchId];
    }

    function getBatchIds()
        external
        view
        returns (string[] memory)
    {
        return batchIds;
    }

    function getBatchCount()
        external
        view
        returns (uint256)
    {
        return batchIds.length;
    }

    function getProductBatchIds(
        string memory productId
    )
        external
        view
        productMustExist(productId)
        returns (string[] memory)
    {
        return productBatchIds[productId];
    }

    function getProductBatchCount(
        string memory productId
    )
        external
        view
        productMustExist(productId)
        returns (uint256)
    {
        return productBatchIds[productId].length;
    }

    // BATCH TRANSFER
    function transferBatch(
        string memory batchId,
        address newOwner,
        string memory location,
        string memory notes
    )
        external
        batchMustExist(batchId)
    {
        Batch storage batch = batches[batchId];

        require(
            batch.currentOwner == msg.sender,
            "Only current owner can transfer batch"
        );

        require(
            newOwner != address(0),
            "Invalid new owner"
        );

        require(
            !batch.recalled,
            "Recalled batch cannot be transferred"
        );

        require(
            isAuthorizedOrganization(newOwner),
            "New owner is not authorized"
        );

        require(
            roles[newOwner] != Role.NONE,
            "New owner has no role"
        );

        address previousOwner = batch.currentOwner;

        batch.currentOwner = newOwner;

        ownedBatchCount[previousOwner] -= 1;
        ownedBatchCount[newOwner] += 1;

        if (roles[newOwner] == Role.DISTRIBUTOR) {
            batch.status = BatchStatus.IN_TRANSIT;
        } else if (roles[newOwner] == Role.RETAILER) {
            batch.status = BatchStatus.DELIVERED;
        }

        _recordBatchEvent(
            batchId,
            "BATCH_TRANSFERRED",
            location,
            notes
        );

        emit BatchTransferred(
            batchId,
            previousOwner,
            newOwner
        );
    }

    // BATCH SALE

    function sellBatch(
        string memory batchId,
        address customer,
        string memory location
    )
        external
        onlyRetailer
        batchMustExist(batchId)
    {
        Batch storage batch = batches[batchId];

        require(
            batch.currentOwner == msg.sender,
            "Retailer does not own this batch"
        );

        require(
            !batch.recalled,
            "Recalled batch cannot be sold"
        );

        require(
            customer != address(0),
            "Invalid customer address"
        );

        batch.currentOwner = customer;
        batch.status = BatchStatus.SOLD;

        ownedBatchCount[msg.sender] -= 1;
        ownedBatchCount[customer] += 1;

        _recordBatchEvent(
            batchId,
            "BATCH_SOLD",
            location,
            "Batch sold to customer"
        );

        emit BatchSold(
            batchId,
            msg.sender,
            customer
        );
    }

    // RECALL MANAGEMENT

    function recallBatch(
        string memory batchId,
        string memory reason,
        string memory location
    )
        external
        batchMustExist(batchId)
    {
        require(
            msg.sender == admin ||
            roles[msg.sender] == Role.MANUFACTURER,
            "Not authorized to recall"
        );

        Batch storage batch = batches[batchId];

        require(
            !batch.recalled,
            "Batch already recalled"
        );

        require(
            bytes(reason).length > 0,
            "Recall reason required"
        );

        batch.recalled = true;
        batch.status = BatchStatus.RECALLED;
        batch.recallReason = reason;

        _recordBatchEvent(
            batchId,
            "BATCH_RECALLED",
            location,
            reason
        );

        emit BatchRecalled(
            batchId,
            msg.sender,
            reason
        );
    }

    function isBatchRecalled(
        string memory batchId
    )
        external
        view
        batchMustExist(batchId)
        returns (bool)
    {
        return batches[batchId].recalled;
    }

    // BATCH HISTORY

    function recordBatchEvent(
        string memory batchId,
        string memory eventType,
        string memory location,
        string memory notes
    )
        external
        batchMustExist(batchId)
    {
        Batch storage batch = batches[batchId];

        require(
            batch.currentOwner == msg.sender ||
            msg.sender == admin,
            "Not authorized"
        );

        _recordBatchEvent(
            batchId,
            eventType,
            location,
            notes
        );
    }

    function _recordBatchEvent(
        string memory batchId,
        string memory eventType,
        string memory location,
        string memory notes
    )
        internal
    {
        batchHistory[batchId].push(
            BatchEvent({
                eventType: eventType,
                actor: msg.sender,
                timestamp: block.timestamp,
                location: location,
                notes: notes
            })
        );

        emit BatchEventRecorded(
            batchId,
            eventType,
            msg.sender
        );
    }

    function getBatchHistory(
        string memory batchId
    )
        external
        view
        batchMustExist(batchId)
        returns (BatchEvent[] memory)
    {
        return batchHistory[batchId];
    }

    function getBatchHistoryCount(
        string memory batchId
    )
        external
        view
        batchMustExist(batchId)
        returns (uint256)
    {
        return batchHistory[batchId].length;
    }

    // OWNERSHIP / VERIFICATION

    function getCurrentOwner(
        string memory batchId
    )
        external
        view
        batchMustExist(batchId)
        returns (address)
    {
        return batches[batchId].currentOwner;
    }

    function verifyBatch(
        string memory batchId
    )
        external
        view
        batchMustExist(batchId)
        returns (
            bool valid,
            bool recalled,
            address currentOwner,
            BatchStatus status
        )
    {
        Batch memory batch = batches[batchId];

        return (
            true,
            batch.recalled,
            batch.currentOwner,
            batch.status
        );
    }
}