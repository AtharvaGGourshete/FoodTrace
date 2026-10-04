import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import { products } from "../data/mockData";

export default function ProductsPage({
  role = "manufacturer",
}) {
  return (
    <AppShell role={role}>

      <PageHeader
        eyebrow="PRODUCT CATALOG"
        title="Products"
        description="Manage registered food products that can be tracked through FoodTrace."
        action={
          role === "manufacturer" ||
          role === "admin" ? (
            <button className="button button-primary">
              + Register product
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
            placeholder="Search products..."
          />

        </div>

        <select>
          <option>
            All categories
          </option>

          <option>
            Packaged Food
          </option>

          <option>
            Beverage
          </option>

          <option>
            Condiment
          </option>
        </select>

        <select>
          <option>
            All statuses
          </option>

          <option>
            Active
          </option>
        </select>

      </div>

      <section className="panel">

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
          rows={products}
        />

      </section>

    </AppShell>
  );
}