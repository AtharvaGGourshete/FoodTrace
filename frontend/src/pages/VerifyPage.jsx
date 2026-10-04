import { Link, useParams } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import Timeline from "../components/Timeline";
import {
  batches,
  history,
} from "../data/mockData";

export default function VerifyPage() {

  const { batchId } = useParams();

  const batch =
    batches.find(
      (item) => item.id === batchId
    ) || batches[0];

  return (
    <div className="verify-page">

      <header className="verify-header">

        <Link
          className="public-brand"
          to="/"
        >
          <span className="brand-mark">
            F
          </span>

          <span>
            FoodTrace
          </span>
        </Link>

        <span className="verified-network">
          ⌁ Blockchain verification
        </span>

      </header>

      <main className="verify-main">

        <div className="verify-intro">

          <div className="verified-icon">
            ✓
          </div>

          <div className="eyebrow">
            PUBLIC VERIFICATION
          </div>

          <h1>
            Product history verified
          </h1>

          <p>
            This page shows the supply-chain
            information recorded for the
            selected batch.
          </p>

        </div>

        <section
          className={`verification-card ${
            batch.recall ? "recalled" : ""
          }`}
        >

          <div className="verification-head">

            <div className="product-art large">
              🥫
            </div>

            <div>

              <span className="eyebrow">
                PRODUCT
              </span>

              <h2>
                {batch.product}
              </h2>

              <p>
                {batch.id}
              </p>

            </div>

            <StatusBadge>
              {batch.status}
            </StatusBadge>

          </div>

          {batch.recall && (

            <div className="alert alert-danger">

              <span>
                ⚠
              </span>

              <div>

                <strong>
                  RECALLED
                </strong>

                <p>
                  This batch has been recalled.
                  Do not consume or sell this
                  product.
                </p>

              </div>

            </div>

          )}

          <div className="verify-details">

            <div>
              <span>
                Manufacturer
              </span>

              <strong>
                ABC Foods
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
                Quantity
              </span>

              <strong>
                {batch.quantity.toLocaleString()}
                {" "}units
              </strong>
            </div>

            <div>
              <span>
                MRP
              </span>

              <strong>
                {batch.mrp}
              </strong>
            </div>

            <div>
              <span>
                Current status
              </span>

              <StatusBadge>
                {batch.status}
              </StatusBadge>
            </div>

          </div>

        </section>

        <section className="verification-card">

          <div className="panel-header">

            <div>

              <h2>
                Supply-chain journey
              </h2>

              <p>
                Every handoff is represented
                by a recorded event.
              </p>

            </div>

          </div>

          <Timeline
            items={history}
          />

        </section>

        <div className="verification-foot">

          <span>
            FoodTrace Local · Demo verification
          </span>

          <Link to="/">
            Powered by FoodTrace →
          </Link>

        </div>

      </main>

    </div>
  );
}