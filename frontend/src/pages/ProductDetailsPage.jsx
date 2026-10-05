import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import DataTable from "../components/DataTable";

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

export default function ProductDetailsPage({
  role = "manufacturer",
}) {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [manufacturer, setManufacturer] = useState(null);
  const [productBatches, setProductBatches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      try {
        setLoading(true);
        setError("");

        const contract = getReadOnlyContract();

        // --------------------------------------------------
        // 1. Load product
        // --------------------------------------------------

        const productData =
          await contract.getProduct(id);

        // --------------------------------------------------
        // 2. Load manufacturer organization
        // --------------------------------------------------

        let manufacturerData = null;

        try {
          const organizationId =
            await contract.organizationIdByAddress(
              productData.manufacturer
            );

          if (organizationId) {
            manufacturerData =
              await contract.getOrganization(
                organizationId
              );
          }
        } catch (organizationError) {
          console.warn(
            "Could not load manufacturer organization:",
            organizationError
          );
        }

        // --------------------------------------------------
        // 3. Get all batch IDs belonging to this product
        // --------------------------------------------------

        const batchIds =
          await contract.getProductBatchIds(id);

        // --------------------------------------------------
        // 4. Load each batch
        // --------------------------------------------------

        const batches = await Promise.all(
          batchIds.map(async (batchId) => {
            const batch =
              await contract.getBatch(batchId);

            let ownerName =
              shortenAddress(batch.currentOwner);

            try {
              const ownerOrganizationId =
                await contract.organizationIdByAddress(
                  batch.currentOwner
                );

              if (ownerOrganizationId) {
                const ownerOrganization =
                  await contract.getOrganization(
                    ownerOrganizationId
                  );

                ownerName =
                  ownerOrganization.name;
              }
            } catch (ownerError) {
              console.warn(
                "Could not resolve batch owner:",
                ownerError
              );
            }

            return {
              id: batch.batchId,
              quantity: Number(batch.quantity),
              manufactureDate:
                formatDate(
                  batch.manufacturingDate
                ),
              expiryDate:
                formatDate(batch.expiryDate),
              owner: ownerName,
              status:
                BATCH_STATUS[
                  Number(batch.status)
                ] || "UNKNOWN",
            };
          })
        );

        if (cancelled) return;

        setProduct({
          id: productData.productId,
          name: productData.name,
          description: productData.description,
          category: productData.category,
          manufacturer:
            manufacturerData?.name ||
            shortenAddress(
              productData.manufacturer
            ),
          manufacturerId:
            manufacturerData?.organizationId ||
            "—",
          status: productData.active
            ? "ACTIVE"
            : "INACTIVE",
          batchCount: batchIds.length,
        });

        setManufacturer(
          manufacturerData
        );

        setProductBatches(batches);

      } catch (err) {
        console.error(
          "Failed to load product:",
          err
        );

        if (!cancelled) {
          setError(
            err?.shortMessage ||
              err?.message ||
              "Failed to load product from blockchain."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadProduct();
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  // --------------------------------------------------
  // Loading state
  // --------------------------------------------------

  if (loading) {
    return (
      <AppShell role={role}>
        <PageHeader
          eyebrow="PRODUCT"
          title="Loading product..."
          description="Reading product information from the FoodTrace blockchain."
          action={
            <Link
              className="button button-secondary"
              to="/app/products"
            >
              ← Back to products
            </Link>
          }
        />

        <section className="panel">
          <p className="muted">
            Loading blockchain data...
          </p>
        </section>
      </AppShell>
    );
  }

  // --------------------------------------------------
  // Error state
  // --------------------------------------------------

  if (error || !product) {
    return (
      <AppShell role={role}>
        <PageHeader
          eyebrow={`PRODUCT ${id || ""}`}
          title="Product unavailable"
          description="The requested product could not be loaded from the FoodTrace blockchain."
          action={
            <Link
              className="button button-secondary"
              to="/app/products"
            >
              ← Back to products
            </Link>
          }
        />

        <section className="panel">
          <p className="muted">
            {error || "Product not found."}
          </p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell role={role}>

      <PageHeader
        eyebrow={`PRODUCT ${product.id}`}
        title={product.name}
        description={product.description}
        action={
          <Link
            className="button button-secondary"
            to="/app/products"
          >
            ← Back to products
          </Link>
        }
      />

      <div className="detail-grid">

        <section className="panel">

          <div className="product-detail-art">
            🥫
          </div>

          <div className="detail-info">

            <div>
              <span>
                Category
              </span>

              <strong>
                {product.category}
              </strong>
            </div>

            <div>
              <span>
                Manufacturer
              </span>

              <strong>
                {product.manufacturer}
              </strong>
            </div>

            <div>
              <span>
                Organization ID
              </span>

              <strong>
                {product.manufacturerId}
              </strong>
            </div>

            <div>
              <span>
                Status
              </span>

              <StatusBadge>
                {product.status}
              </StatusBadge>
            </div>

          </div>

        </section>

        <section className="panel">

          <div className="panel-header">

            <div>

              <h2>
                Product lifecycle
              </h2>

              <p>
                Batch-level records
              </p>

            </div>

          </div>

          <div className="metric-big">
            {product.batchCount}
          </div>

          <p className="muted">
            Total batches registered
            for this product
          </p>

        </section>

      </div>

      <section className="panel">

        <div className="panel-header">

          <div>

            <h2>
              Associated batches
            </h2>

            <p>
              Traceable batch records
            </p>

          </div>

        </div>

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
          rows={productBatches}
        />

      </section>

    </AppShell>
  );
}