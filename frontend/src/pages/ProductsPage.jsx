import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import { getReadOnlyContract } from "../blockchain/contract";

const ROLE_LABELS = {
  0: "Admin",
  1: "Manufacturer",
  2: "Distributor",
  3: "Retailer",
  4: "Customer",
};

function formatStatus(active) {
  return active ? "ACTIVE" : "INACTIVE";
}

export default function ProductsPage({
  role = "manufacturer",
}) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const contract = getReadOnlyContract();
        const productIds = await contract.getProductIds();

        const rows = await Promise.all(
          productIds.map(async (productId) => {
            const product = await contract.getProduct(productId);

            let manufacturerName = product.manufacturer;
            let manufacturerRole = "Unknown";

            try {
              const organizationId =
                await contract.organizationIdByAddress(
                  product.manufacturer
                );

              if (organizationId) {
                const organization =
                  await contract.getOrganization(
                    organizationId
                  );

                manufacturerName =
                  organization.name ||
                  product.manufacturer;

                manufacturerRole =
                  ROLE_LABELS[
                    Number(organization.role)
                  ] || "Unknown";
              }
            } catch {
              // Keep the wallet address if the organization lookup fails.
            }

            const batchIds =
              await contract.getProductBatchIds(
                productId
              );

            return {
              id: product.productId,
              name: product.name,
              description: product.description,
              category: product.category,
              manufacturer: manufacturerName,
              manufacturerWallet: product.manufacturer,
              manufacturerRole,
              batches: batchIds.length,
              status: formatStatus(product.active),
              active: product.active,
              createdAt: Number(product.createdAt),
            };
          })
        );

        if (!cancelled) {
          setProducts(rows);
        }
      } catch (err) {
        console.error("Failed to load products:", err);

        if (!cancelled) {
          setError(
            err?.shortMessage ||
              err?.reason ||
              err?.message ||
              "Failed to load products from the blockchain."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    return [
      ...new Set(
        products
          .map((product) => product.category)
          .filter(Boolean)
      ),
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.id.toLowerCase().includes(query) ||
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.manufacturer
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        category === "ALL" ||
        product.category === category;

      const matchesStatus =
        status === "ALL" ||
        product.status === status;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [products, search, category, status]);

  return (
    <AppShell role={role}>
      <PageHeader
        eyebrow="PRODUCT CATALOG"
        title="Products"
        description="Manage registered food products that can be tracked through FoodTrace."
        action={
          role === "manufacturer" ||
          role === "admin" ? (
            <button
              className="button button-primary"
              type="button"
            >
              + Register product
            </button>
          ) : null
        }
      />

      <div className="filter-row">
        <div className="search-box">
          <span>⌕</span>

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search products..."
          />
        </div>

        <select
          value={category}
          onChange={(event) =>
            setCategory(event.target.value)
          }
        >
          <option value="ALL">
            All categories
          </option>

          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value)
          }
        >
          <option value="ALL">
            All statuses
          </option>

          <option value="ACTIVE">
            Active
          </option>

          <option value="INACTIVE">
            Inactive
          </option>
        </select>
      </div>

      <section className="panel">
        {loading ? (
          <div className="empty-state">
            Loading products from blockchain...
          </div>
        ) : error ? (
          <div className="alert alert-danger">
            <span>⚠</span>

            <div>
              <strong>
                Failed to load products
              </strong>

              <p>{error}</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            No products found.
          </div>
        ) : (
          <DataTable
            columns={[
              {
                key: "id",
                label: "Product ID",
              },

              {
                key: "name",
                label: "Product",
                render: (row) => (
                  <Link
                    className="table-link"
                    to={`/app/products/${row.id}`}
                  >
                    {row.name}
                  </Link>
                ),
              },

              {
                key: "category",
                label: "Category",
              },

              {
                key: "manufacturer",
                label: "Manufacturer",
              },

              {
                key: "batches",
                label: "Batches",
                render: (row) => (
                  <Link
                    className="table-link"
                    to={`/app/products/${row.id}`}
                  >
                    {row.batches}
                  </Link>
                ),
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

              {
                key: "action",
                label: "",
                render: (row) => (
                  <Link
                    className="row-action"
                    to={`/app/products/${row.id}`}
                  >
                    View →
                  </Link>
                ),
              },
            ]}
            rows={filteredProducts}
          />
        )}
      </section>
    </AppShell>
  );
}
