import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import StatusBadge from "../components/StatusBadge";
import { batches } from "../data/mockData";

export default function RecallPage() {
  const recallableBatches =
    batches.filter(
      (batch) => !batch.recall
    );

  return (
    <AppShell role="manufacturer">

      <div className="page-header">

        <div>

          <div className="eyebrow">
            SAFETY CONTROL
          </div>

          <h1>
            Recall batch
          </h1>

          <p>
            Flag a batch as recalled and
            prevent further supply-chain
            transfers.
          </p>

        </div>

      </div>

      <div className="alert alert-warning">

        <span>
          ⚠
        </span>

        <div>

          <strong>
            Use recalls carefully.
          </strong>

          <p>
            A recalled batch should remain
            visible in its history for
            auditability.
          </p>

        </div>

      </div>

      <div className="form-layout">

        <section className="panel form-panel">

          <div className="panel-header">

            <div>

              <h2>
                Recall details
              </h2>

              <p>
                Static demonstration form
              </p>

            </div>

          </div>

          <form
            onSubmit={(e) =>
              e.preventDefault()
            }
          >

            <label>
              Batch to recall
            </label>

            <select>

              {recallableBatches.map(
                (batch) => (

                  <option key={batch.id}>
                    {batch.id} — {batch.product}
                  </option>

                )
              )}

            </select>

            <label>
              Reason
            </label>

            <select>

              <option>
                Quality issue
              </option>

              <option>
                Contamination detected
              </option>

              <option>
                Packaging issue
              </option>

              <option>
                Incorrect labeling
              </option>

              <option>
                Other
              </option>

            </select>

            <label>
              Recall description
            </label>

            <textarea
              rows="5"
              placeholder="Describe why this batch is being recalled..."
            />

            <div className="form-actions">

              <Link
                className="button button-secondary"
                to="/app/batches"
              >
                Cancel
              </Link>

              <button
                className="button button-danger"
                type="submit"
              >
                Recall batch
              </button>

            </div>

          </form>

        </section>

        <section className="panel">

          <div className="panel-header">

            <div>

              <h2>
                Existing recalls
              </h2>

              <p>
                Previously flagged batches
              </p>

            </div>

          </div>

          <div className="recall-list">

            {batches
              .filter((batch) => batch.recall)
              .map((batch) => (

                <div
                  className="recall-item"
                  key={batch.id}
                >

                  <div>

                    <strong>
                      {batch.id}
                    </strong>

                    <span>
                      {batch.product}
                    </span>

                  </div>

                  <StatusBadge>
                    RECALLED
                  </StatusBadge>

                </div>

              ))}

          </div>

        </section>

      </div>

    </AppShell>
  );
}