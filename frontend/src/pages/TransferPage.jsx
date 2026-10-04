import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";

export default function TransferPage({
  role = "manufacturer",
}) {

  const isRetailer =
    role === "retailer";

  return (
    <AppShell role={role}>

      <PageHeader
        eyebrow="SUPPLY CHAIN"
        title={
          isRetailer
            ? "Receive batch"
            : "Transfer batch"
        }
        description={
          isRetailer
            ? "Confirm receipt of an incoming batch."
            : "Transfer the current batch ownership to the intended participant."
        }
      />

      <div className="form-layout">

        <section className="panel form-panel">

          <div className="panel-header">

            <div>

              <h2>
                {isRetailer
                  ? "Receive shipment"
                  : "New ownership transfer"}
              </h2>

              <p>
                Static form — no transaction
                will be submitted.
              </p>

            </div>

          </div>

          <form
            onSubmit={(e) =>
              e.preventDefault()
            }
          >

            <label>
              Batch
            </label>

            <select defaultValue="BATCH-2026-002">

              <option>
                BATCH-2026-001 — Organic Biscuits
              </option>

              <option>
                BATCH-2026-002 — Organic Biscuits
              </option>

              <option>
                BATCH-2026-003 — Mango Juice
              </option>

            </select>

            {!isRetailer && (
              <>

                <label>
                  Current owner
                </label>

                <input
                  value="ABC Foods · 0x71C...8A21"
                  readOnly
                />

                <label>
                  Recipient organization
                </label>

                <select>
                  <option>
                    XYZ Distribution
                  </option>

                  <option>
                    Retail Store ABC
                  </option>

                  <option>
                    FreshSip Foods
                  </option>

                </select>

              </>
            )}

            <label>
              Quantity
            </label>

            <input
              type="number"
              defaultValue="5000"
              min="1"
            />

            <label>
              Notes
            </label>

            <textarea
              placeholder="Optional shipment notes..."
              rows="4"
            />

            <div className="form-actions">

              <Link
                className="button button-secondary"
                to="/app/batches"
              >
                Cancel
              </Link>

              <button
                className="button button-primary"
                type="submit"
              >
                {isRetailer
                  ? "Confirm receipt"
                  : "Transfer batch"}
              </button>

            </div>

          </form>

        </section>

        <aside className="panel info-panel">

          <span className="feature-icon">
            →
          </span>

          <h2>
            Smart-contract rule
          </h2>

          <p>
            Only the current owner can
            transfer a batch, and recalled
            batches cannot be transferred.
          </p>

          <div className="rule-box">

            <code>
              msg.sender == currentOwner
            </code>

            <span>
              Required
            </span>

          </div>

          <div className="rule-box">

            <code>
              status != RECALLED
            </code>

            <span>
              Required
            </span>

          </div>

        </aside>

      </div>

    </AppShell>
  );
}