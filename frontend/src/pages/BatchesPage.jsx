import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import { batches } from "../data/mockData";

export default function BatchesPage({
  role = "manufacturer",
}) {
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
            placeholder="Search batch number..."
          />

        </div>

        <select>
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
            Recalled
          </option>
        </select>

        <select>
          <option>
            All products
          </option>

          <option>
            Organic Biscuits
          </option>

          <option>
            Mango Juice
          </option>

          <option>
            Tomato Ketchup
          </option>
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
          rows={batches}
        />

      </section>

    </AppShell>
  );
}