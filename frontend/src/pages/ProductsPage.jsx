import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
} from "lucide-react";

import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";

import {
  getReadOnlyContract,
  getSignerContract,
} from "../blockchain/contract";

import {
  getMetaMaskProvider,
} from "../blockchain/provider";

import { useWallet } from "../context/WalletContext";

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

export default function ProductsPage() {

   const { role } = useWallet();

  const walletRole = role?.name?.toLowerCase() || "none";
  const [contract] = useState(() =>
    getReadOnlyContract()
  );

  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    productId: "",
    name: "",
    description: "",
    category: "",
  });

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const productIds =
        await contract.getProductIds();

      const rows = await Promise.all(
        productIds.map(async (productId) => {
          const product =
            await contract.getProduct(productId);

          let manufacturerName =
            product.manufacturer;

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
            // Keep wallet address if organization lookup fails.
          }

          let batchCount = 0;

          try {
            const batchIds =
              await contract.getProductBatchIds(
                productId
              );

            batchCount = batchIds.length;
          } catch {
            batchCount = 0;
          }

          return {
            id: product.productId,
            name: product.name,
            description: product.description,
            category: product.category,
            manufacturer: manufacturerName,
            manufacturerWallet:
              product.manufacturer,
            manufacturerRole,
            batches: batchCount,
            status: formatStatus(
              product.active
            ),
            active: product.active,
            createdAt: Number(
              product.createdAt
            ),
          };
        })
      );

      setProducts(rows);
    } catch (err) {
      console.error(
        "Failed to load products:",
        err
      );

      setError(
        err?.shortMessage ||
          err?.reason ||
          err?.message ||
          "Failed to load products from the blockchain."
      );
    } finally {
      setLoading(false);
    }
  }, [contract]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const categories = useMemo(() => {
    return [
      ...new Set(
        products
          .map(
            (product) => product.category
          )
          .filter(Boolean)
      ),
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.id
          .toLowerCase()
          .includes(query) ||
        product.name
          .toLowerCase()
          .includes(query) ||
        product.category
          .toLowerCase()
          .includes(query) ||
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
  }, [
    products,
    search,
    category,
    status,
  ]);

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleCreateProduct(event) {
    event.preventDefault();

    if (
      !form.productId.trim() ||
      !form.name.trim() ||
      !form.description.trim() ||
      !form.category.trim()
    ) {
      setError(
        "Please fill in all product fields."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const provider =
        await getMetaMaskProvider();

      const signer =
        await provider.getSigner();

      const signerAddress =
        await signer.getAddress();

      console.log(
        "Creating product from:",
        signerAddress
      );

      const signerContract =
        getSignerContract(signer);

      const tx =
        await signerContract.createProduct(
          form.productId.trim(),
          form.name.trim(),
          form.description.trim(),
          form.category.trim()
        );

      console.log(
        "Product transaction:",
        tx.hash
      );

      await tx.wait();

      setForm({
        productId: "",
        name: "",
        description: "",
        category: "",
      });

      setShowForm(false);

      await loadProducts();
    } catch (err) {
      console.error(
        "Product creation failed:",
        err
      );

      setError(
        err?.shortMessage ||
          err?.reason ||
          err?.message ||
          "Failed to create product."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell role={role}>
      <PageHeader
        eyebrow="PRODUCT CATALOG"
        title="Products"
        description="Manage registered food products that can be tracked through FoodTrace."
        action={
          walletRole === "manufacturer" ? (
            <button
              className="button button-primary"
              type="button"
              onClick={() =>
                setShowForm(
                  (current) => !current
                )
              }
              disabled={submitting}
            >
              <Plus
                size={17}
                strokeWidth={2}
              />

              {showForm
                ? "Close"
                : "Register product"}
            </button>
          ) : walletRole === "admin" ? (
            <button
              className="button bg-white text-gray-800 border border-gray-300 hover:bg-gray-100 hover:text-gray-900 focus:ring-4 focus:outline-none focus:ring-gray-200 font-medium rounded-lg text-sm px-4 py-2 text-center inline-flex items-center dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-700 dark:focus:ring-gray-700"
              type="button"
              disabled
              title="Only manufacturers can register products."
            >
              <Plus
                size={17}
                strokeWidth={2}
              />

              Register product
            </button>
          ) : null
        }
      />

      {showForm && (
        <section
          className="panel"
          style={{
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 20,
            }}
          >
            <Package
              size={22}
              strokeWidth={2}
            />

            <h2 style={{ margin: 0 }}>
              Register Product
            </h2>
          </div>

          <form
            onSubmit={
              handleCreateProduct
            }
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
              }}
            >
              <label>
                <span>
                  Product ID
                </span>

                <input
                  name="productId"
                  value={
                    form.productId
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="P104"
                  required
                />
              </label>

              <label>
                <span>
                  Product Name
                </span>

                <input
                  name="name"
                  value={form.name}
                  onChange={
                    handleChange
                  }
                  placeholder="Fresh Apple Juice"
                  required
                />
              </label>

              <label>
                <span>
                  Category
                </span>

                <input
                  name="category"
                  value={
                    form.category
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Beverage"
                  required
                />
              </label>

              <label
                style={{
                  gridColumn:
                    "1 / -1",
                }}
              >
                <span>
                  Description
                </span>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Fresh apple juice produced and packaged by the manufacturer."
                  rows={4}
                  required
                />
              </label>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent:
                  "flex-end",
                marginTop: 20,
              }}
            >
              <button
                type="submit"
                className="button button-primary"
                disabled={submitting}
              >
                {submitting
                  ? "Registering..."
                  : "Register on blockchain"}
              </button>
            </div>
          </form>
        </section>
      )}

      {error && (
        <section
          className="panel"
          style={{
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <AlertTriangle
              size={20}
              strokeWidth={2}
            />

            <div>
              <strong>
                Product operation failed
              </strong>

              <p
                style={{
                  margin:
                    "5px 0 0",
                }}
              >
                {error}
              </p>
            </div>
          </div>
        </section>
      )}

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
            placeholder="Search products..."
          />

        </div>

        <select
          value={category}
          onChange={(event) =>
            setCategory(
              event.target.value
            )
          }
        >
          <option value="ALL">
            All categories
          </option>

          {categories.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(event) =>
            setStatus(
              event.target.value
            )
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
            Loading products from
            blockchain...
          </div>
        ) : error &&
          products.length === 0 ? (
          <div className="empty-state">
            No products available.
          </div>
        ) : filteredProducts.length ===
          0 ? (
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
                    className="row-action-link"
                    to={`/app/products/${row.id}`}
                  >
                    View
                  </Link>
                ),
              },
            ]}
            rows={
              filteredProducts
            }
          />
        )}
      </section>
    </AppShell>
  );
}