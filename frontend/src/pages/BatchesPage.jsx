import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";

import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";

import {
  getReadOnlyContract,
  getSignerContract,
} from "../blockchain/contract";

import { getMetaMaskProvider } from "../blockchain/provider";
import { useWallet } from "../context/WalletContext";

const BATCH_STATUS = {
  0: "Active",
  1: "Sold",
  2: "Recalled",
  3: "In Transit",
  4: "Delivered",
};

export default function BatchesPage() {
  const {
    address,
    role,
  } = useWallet();

  const appRole =
    role?.name?.toLowerCase() || "customer";

  // ============================================================
  // BATCHES
  // ============================================================

  const [batches, setBatches] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All statuses");

  const [productFilter, setProductFilter] =
    useState("All products");

  // ============================================================
  // PRODUCTS
  // ============================================================

  const [products, setProducts] = useState([]);

  // ============================================================
  // CREATE BATCH MODAL
  // ============================================================

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [creating, setCreating] =
    useState(false);

  const [createError, setCreateError] =
    useState("");

  const [refreshKey, setRefreshKey] =
    useState(0);

  const [createForm, setCreateForm] = useState({
    batchId: "",
    productId: "",
    quantity: "",
    manufacturingDate: "",
    expiryDate: "",
    mrp: "",
    location: "",
  });

  // ============================================================
  // LOAD PRODUCTS
  // ============================================================

  useEffect(() => {
    async function loadProducts() {
      try {
        const contract =
          getReadOnlyContract();

        const productIds =
          await contract.getProductIds();

        const productList =
          await Promise.all(
            productIds.map(
              async (productId) => {
                const product =
                  await contract.getProduct(
                    productId
                  );

                return {
                  id: product.productId,
                  name: product.name,
                  description:
                    product.description,
                  category:
                    product.category,
                  manufacturer:
                    product.manufacturer,
                  active: product.active,
                };
              }
            )
          );

        setProducts(
          productList.filter(
            (product) => product.active
          )
        );
      } catch (error) {
        console.error(
          "Failed to load products:",
          error
        );

        setProducts([]);
      }
    }

    loadProducts();
  }, [refreshKey]);

  // ============================================================
  // LOAD BATCHES
  // ============================================================

  useEffect(() => {
    async function loadBatches() {
      try {
        setLoading(true);

        const contract =
          getReadOnlyContract();

        const batchIds =
          await contract.getBatchIds();

        const batchList =
          await Promise.all(
            batchIds.map(
              async (batchId) => {
                const batch =
                  await contract.getBatch(
                    batchId
                  );

                // ------------------------------------------------
                // PRODUCT
                // ------------------------------------------------

                let productName =
                  batch.productId;

                try {
                  const product =
                    await contract.getProduct(
                      batch.productId
                    );

                  productName =
                    product.name;
                } catch (error) {
                  console.warn(
                    "Could not load product:",
                    batch.productId
                  );
                }

                // ------------------------------------------------
                // CURRENT OWNER
                // ------------------------------------------------

                let ownerName =
                  batch.currentOwner;

                try {
                  const organizationId =
                    await contract.organizationIdByAddress(
                      batch.currentOwner
                    );

                  if (organizationId) {
                    const organization =
                      await contract.getOrganization(
                        organizationId
                      );

                    ownerName =
                      organization.name;
                  }
                } catch (error) {
                  console.warn(
                    "Could not load owner:",
                    batch.currentOwner
                  );
                }

                return {
                  id: batch.batchId,

                  productId:
                    batch.productId,

                  product:
                    productName,

                  quantity:
                    batch.quantity.toString(),

                  manufactureDate:
                    new Date(
                      Number(
                        batch.manufacturingDate
                      ) * 1000
                    ).toLocaleDateString(),

                  expiryDate:
                    new Date(
                      Number(
                        batch.expiryDate
                      ) * 1000
                    ).toLocaleDateString(),

                  // Display owner name
                  owner:
                    ownerName,

                  // IMPORTANT:
                  // Actual blockchain owner wallet
                  ownerAddress:
                    batch.currentOwner,

                  status:
                    BATCH_STATUS[
                      Number(batch.status)
                    ] || "Unknown",

                  statusValue:
                    Number(batch.status),

                  recalled:
                    batch.recalled,
                };
              }
            )
          );

        setBatches(batchList);
      } catch (error) {
        console.error(
          "Failed to load batches:",
          error
        );

        setBatches([]);
      } finally {
        setLoading(false);
      }
    }

    loadBatches();
  }, [refreshKey]);

  // ============================================================
  // CREATE FORM CHANGE
  // ============================================================

  function handleCreateFormChange(event) {
    const {
      name,
      value,
    } = event.target;

    setCreateForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  }

  // ============================================================
  // CREATE BATCH
  // ============================================================

  async function handleCreateBatch(event) {
    event.preventDefault();

    setCreateError("");

    if (
      role?.name !== "MANUFACTURER"
    ) {
      setCreateError(
        "Only a manufacturer can create a batch."
      );

      return;
    }

    if (
      !createForm.batchId.trim() ||
      !createForm.productId ||
      !createForm.quantity ||
      !createForm.manufacturingDate ||
      !createForm.expiryDate ||
      !createForm.mrp ||
      !createForm.location.trim()
    ) {
      setCreateError(
        "Please fill in all fields."
      );

      return;
    }

    if (
      Number(createForm.quantity) <= 0
    ) {
      setCreateError(
        "Quantity must be greater than zero."
      );

      return;
    }

    if (
      Number(createForm.mrp) <= 0
    ) {
      setCreateError(
        "MRP must be greater than zero."
      );

      return;
    }

    const manufacturingDate =
      new Date(
        `${createForm.manufacturingDate}T00:00:00`
      );

    const expiryDate =
      new Date(
        `${createForm.expiryDate}T00:00:00`
      );

    if (
      expiryDate <= manufacturingDate
    ) {
      setCreateError(
        "Expiry date must be after manufacturing date."
      );

      return;
    }

    try {
      setCreating(true);

      const provider =
        await getMetaMaskProvider();

      const signer =
        await provider.getSigner(
          address
        );

      const contract =
        getSignerContract(
          signer
        );

      const manufacturingTimestamp =
        Math.floor(
          manufacturingDate.getTime() /
            1000
        );

      const expiryTimestamp =
        Math.floor(
          expiryDate.getTime() /
            1000
        );

      const transaction =
        await contract.createBatch(
          createForm.batchId.trim(),

          createForm.productId,

          BigInt(
            createForm.quantity
          ),

          BigInt(
            manufacturingTimestamp
          ),

          BigInt(
            expiryTimestamp
          ),

          BigInt(
            createForm.mrp
          ),

          createForm.location.trim()
        );

      await transaction.wait();

      setCreateForm({
        batchId: "",
        productId: "",
        quantity: "",
        manufacturingDate: "",
        expiryDate: "",
        mrp: "",
        location: "",
      });

      setShowCreateModal(false);

      setRefreshKey(
        (value) => value + 1
      );
    } catch (error) {
      console.error(
        "Create batch failed:",
        error
      );

      let message =
        "Failed to create batch.";

      if (error?.reason) {
        message =
          error.reason;
      } else if (error?.shortMessage) {
        message =
          error.shortMessage;
      } else if (error?.message) {
        message =
          error.message;
      }

      setCreateError(message);
    } finally {
      setCreating(false);
    }
  }

  // ============================================================
  // FILTER BATCHES BY ROLE
  // ============================================================

  const filteredBatches =
    batches.filter((batch) => {
      // --------------------------------------------------------
      // DISTRIBUTOR
      // --------------------------------------------------------
      //
      // Distributor sees only:
      //
      // currentOwner == connected distributor wallet
      // AND
      // status == IN_TRANSIT
      //
      // This represents batches transferred from a
      // manufacturer to this distributor.
      // --------------------------------------------------------

      if (
        role?.name === "DISTRIBUTOR"
      ) {
        const isMyIncomingBatch =
          address &&
          batch.ownerAddress &&
          batch.ownerAddress.toLowerCase() ===
            address.toLowerCase() &&
          batch.status ===
            "In Transit";

        if (!isMyIncomingBatch) {
          return false;
        }
      }

      // --------------------------------------------------------
      // RETAILER
      // --------------------------------------------------------
      //
      // Retailer sees only:
      //
      // currentOwner == connected retailer wallet
      // AND
      // status == DELIVERED
      //
      // This represents batches transferred from a
      // distributor to this retailer.
      // --------------------------------------------------------

      if (
        role?.name === "RETAILER"
      ) {
        const isMyIncomingBatch =
          address &&
          batch.ownerAddress &&
          batch.ownerAddress.toLowerCase() ===
            address.toLowerCase() &&
          batch.status ===
            "Delivered";

        if (!isMyIncomingBatch) {
          return false;
        }
      }

      // --------------------------------------------------------
      // SEARCH
      // --------------------------------------------------------

      const searchMatch =
        batch.id
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      // --------------------------------------------------------
      // STATUS FILTER
      // --------------------------------------------------------

      const statusMatch =
        statusFilter ===
          "All statuses" ||
        batch.status ===
          statusFilter;

      // --------------------------------------------------------
      // PRODUCT FILTER
      // --------------------------------------------------------

      const productMatch =
        productFilter ===
          "All products" ||
        batch.product ===
          productFilter;

      return (
        searchMatch &&
        statusMatch &&
        productMatch
      );
    });

  // ============================================================
  // ROLE-SPECIFIC HEADER
  // ============================================================

  const isDistributor =
    role?.name === "DISTRIBUTOR";

  const isRetailer =
    role?.name === "RETAILER";

  let pageTitle = "Batches";

  let pageDescription =
    "Track batch ownership, status, quantity and lifecycle events.";

  if (isDistributor) {
    pageTitle =
      "Incoming batches";

    pageDescription =
      "View batches currently in transit to your distribution organization.";
  }

  if (isRetailer) {
    pageTitle =
      "Incoming batches";

    pageDescription =
      "View batches currently delivered to your retail organization.";
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <AppShell role={appRole}>
      <PageHeader
        eyebrow="BATCH MANAGEMENT"
        title={pageTitle}
        description={
          pageDescription
        }
        action={
          role?.name ===
          "MANUFACTURER" ? (
            <button
              className="button button-primary"
              onClick={() => {
                setCreateError("");
                setShowCreateModal(true);
              }}
            >
              <Plus
                size={17}
                strokeWidth={2}
              />

              Create batch
            </button>
          ) : role?.name ===
            "ADMIN" ? (
            <button
              className="button"
              disabled
              style={{
                backgroundColor:
                  "#ffffff",
                color: "#9ca3af",
                border:
                  "1px solid #e5e7eb",
                cursor:
                  "not-allowed",
              }}
            >
              <Plus
                size={17}
                strokeWidth={2}
              />

              Create batch
            </button>
          ) : null
        }
      />

      {/* ======================================================
          FILTERS
          ====================================================== */}

      <div className="filter-row">
        <div className="search-box">
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Search
              size={18}
              strokeWidth={2}
            />
          </span>

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search batch number..."
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >
          <option>
            All statuses
          </option>

          <option>
            Active
          </option>

          <option>
            In Transit
          </option>

          <option>
            Delivered
          </option>

          <option>
            Sold
          </option>

          <option>
            Recalled
          </option>
        </select>

        <select
          value={productFilter}
          onChange={(event) =>
            setProductFilter(
              event.target.value
            )
          }
        >
          <option>
            All products
          </option>

          {products.map(
            (product) => (
              <option
                key={product.id}
                value={product.name}
              >
                {product.name}
              </option>
            )
          )}
        </select>
      </div>

      {/* ======================================================
          ROLE-SPECIFIC INFO
          ====================================================== */}

      {(isDistributor ||
        isRetailer) && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px 16px",
            border:
              "1px solid #e2e8f0",
            background:
              "#f8fafc",
            borderRadius: "8px",
            color: "#475569",
            fontSize: "14px",
          }}
        >
          {isDistributor
            ? "Showing only batches currently in transit to your distributor wallet."
            : "Showing only batches currently delivered to your retailer wallet."}
        </div>
      )}

      {/* ======================================================
          BATCH TABLE
          ====================================================== */}

      <section className="panel">
        <DataTable
          columns={[
            {
              key: "id",
              label: "Batch ID",

              render: (row) => (
                <Link
                  className="table-link"
                  to={`/app/batches/${row.id}`}
                >
                  {row.id}
                </Link>
              ),
            },

            {
              key: "product",
              label: "Product",
            },

            {
              key: "quantity",
              label: "Quantity",
            },

            {
              key: "manufactureDate",
              label: "Manufactured",
            },

            {
              key: "expiryDate",
              label: "Expiry",
            },

            {
              key: "owner",
              label: "Current owner",
            },

            {
              key: "status",
              label: "Status",

              render: (row) => (
                <StatusBadge>
                  {row.status}
                </StatusBadge>
              ),
            },
          ]}
          rows={
            loading
              ? []
              : filteredBatches
          }
        />
      </section>

      {/* ======================================================
          CREATE BATCH MODAL
          ====================================================== */}

      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            padding: "24px",
            zIndex: 1000,
          }}
        >
          <div
            className="panel"
            style={{
              width: "100%",
              maxWidth: "620px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              className="panel-header"
              style={{
                marginBottom:
                  "20px",
              }}
            >
              <div>
                <p className="eyebrow">
                  BATCH MANAGEMENT
                </p>

                <h2>
                  Create new batch
                </h2>

                <p className="muted">
                  Register a new food
                  batch on the
                  blockchain.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreateModal(
                    false
                  )
                }
                style={{
                  border: "none",
                  background:
                    "transparent",
                  fontSize:
                    "24px",
                  cursor:
                    "pointer",
                  color:
                    "#64748b",
                }}
              >
                ×
              </button>
            </div>

            {createError && (
              <div
                style={{
                  padding:
                    "12px 14px",
                  marginBottom:
                    "18px",
                  border:
                    "1px solid #fecaca",
                  background:
                    "#fef2f2",
                  color:
                    "#b91c1c",
                  borderRadius:
                    "8px",
                  fontSize:
                    "14px",
                }}
              >
                {createError}
              </div>
            )}

            <form
              onSubmit={
                handleCreateBatch
              }
            >
              {/* Batch ID */}

              <div
                style={{
                  marginBottom:
                    "16px",
                }}
              >
                <label>
                  Batch ID
                </label>

                <input
                  name="batchId"
                  value={
                    createForm.batchId
                  }
                  onChange={
                    handleCreateFormChange
                  }
                  placeholder="e.g. BATCH-2026-005"
                  required
                  style={{
                    width: "100%",
                    marginTop:
                      "6px",
                  }}
                />
              </div>

              {/* Product */}

              <div
                style={{
                  marginBottom:
                    "16px",
                }}
              >
                <label>
                  Product
                </label>

                <select
                  name="productId"
                  value={
                    createForm.productId
                  }
                  onChange={
                    handleCreateFormChange
                  }
                  required
                  style={{
                    width: "100%",
                    marginTop:
                      "6px",
                  }}
                >
                  <option value="">
                    Select product
                  </option>

                  {products.map(
                    (product) => (
                      <option
                        key={
                          product.id
                        }
                        value={
                          product.id
                        }
                      >
                        {product.id} —{" "}
                        {
                          product.name
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Quantity + MRP */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap: "16px",
                  marginBottom:
                    "16px",
                }}
              >
                <div>
                  <label>
                    Quantity
                  </label>

                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    value={
                      createForm.quantity
                    }
                    onChange={
                      handleCreateFormChange
                    }
                    placeholder="5000"
                    required
                    style={{
                      width: "100%",
                      marginTop:
                        "6px",
                    }}
                  />
                </div>

                <div>
                  <label>
                    MRP
                  </label>

                  <input
                    type="number"
                    name="mrp"
                    min="1"
                    value={
                      createForm.mrp
                    }
                    onChange={
                      handleCreateFormChange
                    }
                    placeholder="50"
                    required
                    style={{
                      width: "100%",
                      marginTop:
                        "6px",
                    }}
                  />
                </div>
              </div>

              {/* Dates */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap: "16px",
                  marginBottom:
                    "16px",
                }}
              >
                <div>
                  <label>
                    Manufacturing date
                  </label>

                  <input
                    type="date"
                    name="manufacturingDate"
                    value={
                      createForm.manufacturingDate
                    }
                    onChange={
                      handleCreateFormChange
                    }
                    required
                    style={{
                      width: "100%",
                      marginTop:
                        "6px",
                    }}
                  />
                </div>

                <div>
                  <label>
                    Expiry date
                  </label>

                  <input
                    type="date"
                    name="expiryDate"
                    value={
                      createForm.expiryDate
                    }
                    onChange={
                      handleCreateFormChange
                    }
                    required
                    style={{
                      width: "100%",
                      marginTop:
                        "6px",
                    }}
                  />
                </div>
              </div>

              {/* Location */}

              <div
                style={{
                  marginBottom:
                    "22px",
                }}
              >
                <label>
                  Manufacturing
                  location
                </label>

                <input
                  name="location"
                  value={
                    createForm.location
                  }
                  onChange={
                    handleCreateFormChange
                  }
                  placeholder="Mumbai"
                  required
                  style={{
                    width: "100%",
                    marginTop:
                      "6px",
                  }}
                />
              </div>

              {/* Buttons */}

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "flex-end",
                  gap: "10px",
                }}
              >
                <button
                  type="button"
                  className="button"
                  onClick={() =>
                    setShowCreateModal(
                      false
                    )
                  }
                  disabled={creating}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="button button-primary"
                  disabled={creating}
                >
                  {creating
                    ? "Creating..."
                    : "Create batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}