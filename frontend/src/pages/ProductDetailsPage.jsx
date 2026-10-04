import { Link, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import DataTable from "../components/DataTable";
import {
  products,
  batches,
} from "../data/mockData";

export default function ProductDetailsPage({
  role = "manufacturer",
}) {

  const { id } = useParams();

  const product =
    products.find(
      (item) => item.id === id
    ) || products[0];

  const productBatches =
    batches.filter(
      (item) =>
        item.productId === product.id
    );

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
            {product.batches}
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