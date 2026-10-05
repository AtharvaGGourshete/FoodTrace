import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";

import { getReadOnlyContract } from "../blockchain/contract";

const BATCH_STATUS = {
  0: "ACTIVE",
  1: "SOLD",
  2: "RECALLED",
  3: "IN TRANSIT",
  4: "DELIVERED",
};

function formatDate(timestamp) {
  if (!timestamp) return "—";

  return new Date(
    Number(timestamp) * 1000
  ).toLocaleDateString();
}

function shortenAddress(address) {
  if (!address) return "—";

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function BatchesPage({
  role = "manufacturer",
}) {
  const [batches, setBatches] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [productFilter, setProductFilter] = useState("All products");

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadBatches() {
      try {
        setLoading(true);
        setError("");

        const contract = getReadOnlyContract();

        /*
         * Get all batch IDs from the latest contract.
         */
        const batchIds =
          await contract.getBatchIds();

        /*
         * Load every batch.
         */
        const batchData = await Promise.all(
          batchIds.map(async (batchId) => {
            const batch =
              await contract.getBatch(batchId);

            /*
             * Resolve product name.
             */
            let productName =
              batch.productId;

            try {
              const product =
                await contract.getProduct(
                  batch.productId
                );

              productName =
                product.name;
            } catch (productError) {
              console.warn(
                "Could not load product:",
                productError
              );
            }

            /*
             * Resolve current owner organization.
             */
            let ownerName =
              shortenAddress(
                batch.currentOwner
              );

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
            } catch (ownerError) {
              console.warn(
                "Could not load batch owner:",
                ownerError
              );
            }

            return {
              id: batch.batchId,

              productId:
                batch.productId,

              product:
                productName,

              quantity:
                Number(batch.quantity),

              manufactureDate:
                formatDate(
                  batch.manufacturingDate
                ),

              expiryDate:
                formatDate(
                  batch.expiryDate
                ),

              owner:
                ownerName,

              ownerAddress:
                batch.currentOwner,

              status:
                BATCH_STATUS[
                  Number(batch.status)
                ] || "UNKNOWN",

              recalled:
                batch.recalled,
            };
          })
        );

        /*
         * Get unique product names for
         * the product filter.
         */
        const uniqueProducts = [
          ...new Map(
            batchData.map((batch) => [
              batch.productId,
              batch.product,
            ])
          ).entries(),
        ].map(([id, name]) => ({
          id,
          name,
        }));

        if (cancelled) return;

        setBatches(batchData);
        setProducts(uniqueProducts);

      } catch (err) {
        console.error(
          "Failed to load batches:",
          err
        );

        if (!cancelled) {
          setError(
            err?.shortMessage ||
              err?.message ||
              "Failed to load batches from blockchain."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBatches();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Apply search + status + product filters.
   */
  const filteredBatches =
    batches.filter((batch) => {
      const matchesSearch =
        batch.id
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const matchesStatus =
        statusFilter === "All statuses" ||
        batch.status ===
          statusFilter.toUpperCase();

      const matchesProduct =
        productFilter === "All products" ||
        batch.product === productFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesProduct
      );
    });

  if (loading) {
    return (
      <AppShell role={role}>
        <PageHeader
          eyebrow="BATCH MANAGEMENT"
          title="Batches"
          description="Track batch ownership, status, quantity and lifecycle events."
        />

        <section className="panel">
          <p className="muted">
            Loading batches from the FoodTrace blockchain...
          </p>
        </section>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell role={role}>
        <PageHeader
          eyebrow="BATCH MANAGEMENT"
          title="Batches"
          description="Track batch ownership, status, quantity and lifecycle events."
        />

        <section className="panel">
          <p className="muted">
            {error}
          </p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell role={role}>

      <PageHeader
        eyebrow="BATCH MANAGEMENT"
        title="Batches"
        description="Track batch ownership, status, quantity and lifecycle events."
        action={
          role === "manufacturer" ? (
            <button className="button button-primary">
              + Create batch
            </button>
          ) : null
        }
      />

      <div className="filter-row">

        <div className="search-box">

          <span>
            ⌕
          </span>

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search batch number..."
          />

        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option>
            All statuses
          </option>

          <option>
            ACTIVE
          </option>

          <option>
            IN TRANSIT
          </option>

          <option>
            DELIVERED
          </option>

          <option>
            SOLD
          </option>

          <option>
            RECALLED
          </option>
        </select>

        <select
          value={productFilter}
          onChange={(event) =>
            setProductFilter(event.target.value)
          }
        >
          <option>
            All products
          </option>

          {products.map((product) => (
            <option
              key={product.id}
              value={product.name}
            >
              {product.name}
            </option>
          ))}
        </select>

      </div>

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
          rows={filteredBatches}
        />

        {filteredBatches.length === 0 && (
          <p className="muted">
            No batches match the selected filters.
          </p>
        )}

      </section>

    </AppShell>
  );
}