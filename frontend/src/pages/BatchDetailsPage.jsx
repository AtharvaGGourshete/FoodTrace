import { Link, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import Timeline from "../components/Timeline";
import {
  batches,
  history,
} from "../data/mockData";

export default function BatchDetailsPage({
  role = "manufacturer",
}) {

  const { id } = useParams();

  const batch =
    batches.find(
      (item) => item.id === id
    ) || batches[0];

  return (
    <AppShell role={role}>

      <PageHeader
        eyebrow="BATCH DETAILS"
        title={batch.id}
        description={`${batch.product} · ${batch.quantity.toLocaleString()} units`}
        action={
          <Link
            className="button button-secondary"
            to="/app/batches"
          >
            ← Back to batches
          </Link>
        }
      />

      {batch.recall && (

        <div className="alert alert-danger">

          <span>
            ⚠
          </span>

          <div>

            <strong>
              This batch has been recalled.
            </strong>

            <p>
              Further transfers should be
              blocked by the smart contract.
            </p>

          </div>

        </div>

      )}

      <div className="detail-grid four">

        {[
          ["Product", batch.product],
          [
            "Quantity",
            batch.quantity.toLocaleString(),
          ],
          ["MRP", batch.mrp],
          ["Current owner", batch.owner],
        ].map(
          ([label, value]) => (

            <div
              className="detail-stat"
              key={label}
            >

              <span>
                {label}
              </span>

              <strong>
                {value}
              </strong>

            </div>

          )
        )}

      </div>

      <div className="two-column">

        <section className="panel">

          <div className="panel-header">

            <div>

              <h2>
                Batch information
              </h2>

              <p>
                Recorded batch metadata
              </p>

            </div>

          </div>

          <div className="detail-info vertical">

            <div>
              <span>
                Batch ID
              </span>

              <strong>
                {batch.id}
              </strong>
            </div>

            <div>
              <span>
                Product ID
              </span>

              <strong>
                {batch.productId}
              </strong>
            </div>

            <div>
              <span>
                Manufacturing date
              </span>

              <strong>
                {batch.manufactureDate}
              </strong>
            </div>

            <div>
              <span>
                Expiry date
              </span>

              <strong>
                {batch.expiryDate}
              </strong>
            </div>

            <div>
              <span>
                Owner role
              </span>

              <strong>
                {batch.ownerRole}
              </strong>
            </div>

            <div>
              <span>
                Status
              </span>

              <StatusBadge>
                {batch.status}
              </StatusBadge>
            </div>

          </div>

        </section>

        <section className="panel">

          <div className="panel-header">

            <div>

              <h2>
                Supply-chain journey
              </h2>

              <p>
                Recorded events
              </p>

            </div>

          </div>

          <Timeline
            items={history}
          />

        </section>

      </div>

      <section className="panel">

        <div className="panel-header">

          <div>

            <h2>
              Blockchain reference
            </h2>

            <p>
              Static demonstration data
            </p>

          </div>

        </div>

        <div className="hash-grid">

          <div>
            <span>
              Batch blockchain ID
            </span>

            <code>
              0xBATCH...001
            </code>
          </div>

          <div>
            <span>
              Latest transaction
            </span>

            <code>
              0x7b92...41aa
            </code>
          </div>

          <div>
            <span>
              Contract
            </span>

            <code>
              0xFood...Trace
            </code>
          </div>

          <div>
            <span>
              Network
            </span>

            <strong>
              FoodTrace Local · 1337
            </strong>
          </div>

        </div>

      </section>

    </AppShell>
  );
}