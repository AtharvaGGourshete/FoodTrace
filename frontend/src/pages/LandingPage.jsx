import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="public-page">

      {/* NAVBAR */}

      <header className="public-nav">

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

        <div className="public-nav-links">

          <a href="#how-it-works">
            How it works
          </a>

          <a href="#features">
            Features
          </a>

          <Link to="/verify/BATCH-2026-001">
            Verify a batch
          </Link>

          <Link
            className="button button-primary button-small"
            to="/wallet"
          >
            Launch DApp
          </Link>

        </div>

      </header>

      {/* HERO */}

      <section className="hero">

        <div className="hero-copy">

          <div className="eyebrow-pill">
            BLOCKCHAIN-BASED TRACEABILITY
          </div>

          <h1>
            Know where your food came from.
          </h1>

          <p>
            FoodTrace creates a transparent,
            tamper-resistant record of food
            batches as they move from
            manufacturer to distributor to
            retailer.
          </p>

          <div className="hero-actions">

            <Link
              className="button button-primary"
              to="/wallet"
            >
              Launch FoodTrace
            </Link>

            <Link
              className="button button-secondary"
              to="/verify/BATCH-2026-001"
            >
              Verify a product
            </Link>

          </div>

          <div className="hero-trust">

            <span>
              ✓ Immutable batch history
            </span>

            <span>
              ✓ Wallet-based identity
            </span>

            <span>
              ✓ Smart-contract rules
            </span>

          </div>

        </div>

        {/* DEMO TRACE CARD */}

        <div className="hero-visual">

          <div className="trace-card">

            <div className="trace-card-head">

              <span>
                Live batch journey
              </span>

              <span className="live-pill">
                <i />
                Demo
              </span>

            </div>

            <div className="trace-product">

              <div className="product-art">
                🥫
              </div>

              <div>
                <strong>
                  Organic Biscuits
                </strong>

                <span>
                  BATCH-2026-001
                </span>
              </div>

              <span className="status-badge active">
                ACTIVE
              </span>

            </div>

            <div className="mini-route">

              {[
                [
                  "01",
                  "Manufacturer",
                  "ABC Foods",
                  "Created",
                ],
                [
                  "02",
                  "Distributor",
                  "XYZ Distribution",
                  "Transferred",
                ],
                [
                  "03",
                  "Retailer",
                  "Retail Store ABC",
                  "Received",
                ],
              ].map(
                ([
                  number,
                  role,
                  name,
                  state,
                ]) => (

                  <div
                    className="route-step"
                    key={number}
                  >

                    <span className="route-number">
                      {number}
                    </span>

                    <div>
                      <small>
                        {role}
                      </small>

                      <strong>
                        {name}
                      </strong>
                    </div>

                    <span className="route-state">
                      ✓ {state}
                    </span>

                  </div>

                )
              )}

            </div>

            <div className="hash-box">

              <span>
                Latest transaction
              </span>

              <code>
                0x7b92...41aa
              </code>

            </div>

          </div>

        </div>

      </section>

      {/* HOW IT WORKS */}

      <section
        id="how-it-works"
        className="public-section"
      >

        <div className="section-heading">

          <div className="eyebrow">
            HOW IT WORKS
          </div>

          <h2>
            One product. One traceable journey.
          </h2>

          <p>
            Every important handoff is recorded
            through blockchain transactions.
          </p>

        </div>

        <div className="steps-grid">

          {[
            [
              "01",
              "Create",
              "Manufacturer registers a product and creates a batch.",
            ],
            [
              "02",
              "Transfer",
              "Ownership moves between authorized supply-chain participants.",
            ],
            [
              "03",
              "Verify",
              "Customers scan a QR code to view the recorded journey.",
            ],
          ].map(
            ([number, title, copy]) => (

              <div
                className="feature-card"
                key={number}
              >

                <span className="step-number">
                  {number}
                </span>

                <h3>
                  {title}
                </h3>

                <p>
                  {copy}
                </p>

              </div>

            )
          )}

        </div>

      </section>

      {/* FEATURES */}

      <section
        id="features"
        className="public-section tinted"
      >

        <div className="section-heading">

          <div className="eyebrow">
            CORE FEATURES
          </div>

          <h2>
            Built around trust at every handoff.
          </h2>

        </div>

        <div className="feature-grid">

          {[
            [
              "⌁",
              "Batch traceability",
              "Follow a batch from manufacturing through retail.",
            ],
            [
              "◈",
              "Smart contracts",
              "Enforce ownership, role, and recall rules on-chain.",
            ],
            [
              "↗",
              "Immutable history",
              "Preserve the sequence of supply-chain events.",
            ],
            [
              "⚠",
              "Recall management",
              "Flag recalled batches and prevent further transfers.",
            ],
            [
              "▦",
              "QR verification",
              "Give customers a simple way to verify product history.",
            ],
            [
              "◉",
              "Role-based access",
              "Separate actions for admins and supply-chain participants.",
            ],
          ].map(
            ([icon, title, copy]) => (

              <div
                className="feature-card feature-card-large"
                key={title}
              >

                <span className="feature-icon">
                  {icon}
                </span>

                <h3>
                  {title}
                </h3>

                <p>
                  {copy}
                </p>

              </div>

            )
          )}

        </div>

      </section>

      {/* FOOTER */}

      <footer className="public-footer">

        <div className="public-brand">

          <span className="brand-mark">
            F
          </span>

          <span>
            FoodTrace
          </span>

        </div>

        <span>
          Blockchain-Based Food Supply Chain
          Traceability System
        </span>

      </footer>

    </div>
  );
}