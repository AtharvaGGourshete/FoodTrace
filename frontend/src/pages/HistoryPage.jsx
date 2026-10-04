import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import Timeline from "../components/Timeline";
import { history } from "../data/mockData";

export default function HistoryPage({
  role = "manufacturer",
}) {
  return (
    <AppShell role={role}>

      <PageHeader
        eyebrow="TRACEABILITY"
        title="Supply-chain history"
        description="A chronological view of recorded product and batch events."
      />

      <div className="history-layout">

        <section className="panel">

          <div className="panel-header">

            <div>

              <h2>
                BATCH-2026-001
              </h2>

              <p>
                Organic Biscuits · 5,000 units
              </p>

            </div>

            <span className="status-badge active">
              ACTIVE
            </span>

          </div>

          <Timeline
            items={history}
          />

        </section>

        <aside className="panel">

          <div className="panel-header">

            <div>

              <h2>
                Journey summary
              </h2>

              <p>
                Current trace
              </p>

            </div>

          </div>

          <div className="journey-summary">

            {[
              [
                "ABC Foods",
                "Manufacturer",
              ],
              [
                "XYZ Distribution",
                "Distributor",
              ],
              [
                "Retail Store ABC",
                "Retailer",
              ],
            ].map(
              ([name, role], index) => (

                <div
                  className="journey-node"
                  key={name}
                >

                  <span>
                    {index + 1}
                  </span>

                  <div>

                    <strong>
                      {name}
                    </strong>

                    <small>
                      {role}
                    </small>

                  </div>

                </div>

              )
            )}

          </div>

          <div className="hash-box">

            <span>
              Blockchain source
            </span>

            <code>
              0xFood...Trace
            </code>

          </div>

        </aside>

      </div>

    </AppShell>
  );
}