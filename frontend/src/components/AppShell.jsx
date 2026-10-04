import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { roleLabels } from "../data/mockData";

const navByRole = {
  admin: [
    ["Dashboard", "/app/admin", "▦"],
    ["Organizations", "/app/admin/organizations", "◉"],
    ["Products", "/app/products", "□"],
    ["Batches", "/app/batches", "◫"],
    ["Transactions", "/app/admin/transactions", "↗"],
  ],

  manufacturer: [
    ["Dashboard", "/app/manufacturer", "▦"],
    ["Products", "/app/products", "□"],
    ["Batches", "/app/batches", "◫"],
    ["Transfer Batch", "/app/transfer", "→"],
    ["Recall Batch", "/app/recall", "⚠"],
    ["History", "/app/history", "◷"],
  ],

  distributor: [
    ["Dashboard", "/app/distributor", "▦"],
    ["Incoming Batches", "/app/batches", "◫"],
    ["Transfer Batch", "/app/transfer", "→"],
    ["History", "/app/history", "◷"],
  ],

  retailer: [
    ["Dashboard", "/app/retailer", "▦"],
    ["Batches", "/app/batches", "◫"],
    ["Receive Batch", "/app/transfer", "↓"],
    ["QR Verification", "/verify/BATCH-2026-001", "⌁"],
    ["History", "/app/history", "◷"],
  ],
};

export default function AppShell({
  role = "manufacturer",
  children,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const links = navByRole[role] || navByRole.manufacturer;

  return (
    <div className="app-shell">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-mark">F</div>

          <div>
            <strong>FoodTrace</strong>
            <span>Supply Chain DApp</span>
          </div>
        </div>

        <div className="sidebar-section-label">
          Workspace
        </div>

        <nav className="side-nav">

          {links.map(([label, href, icon]) => (
            <NavLink
              key={label}
              to={href}
              className={() =>
                `side-link ${
                  location.pathname === href ? "active" : ""
                }`
              }
            >
              <span className="nav-icon">
                {icon}
              </span>

              <span>
                {label}
              </span>
            </NavLink>
          ))}

        </nav>

        <div className="sidebar-bottom">

          <NavLink
            className="side-link"
            to="/verify/BATCH-2026-001"
          >
            <span className="nav-icon">
              ⌁
            </span>

            Public Verification
          </NavLink>

          <button
            className="wallet-mini"
            onClick={() => navigate("/wallet")}
          >
            <span className="status-dot" />

            <span>
              <b>Wallet connected</b>
              <small>0x71C...8A21</small>
            </span>
          </button>

        </div>

      </aside>

      {/* MAIN */}

      <main className="main-area">

        <header className="topbar">

          <div className="breadcrumbs">
            <span>FoodTrace</span>
            <span>/</span>

            <b>
              {roleLabels[role]}
            </b>
          </div>

          <div className="top-actions">

            <button className="icon-button">
              ♢
            </button>

            <button
              className="profile-chip"
              onClick={() => navigate("/wallet")}
            >
              <span className="avatar">
                A
              </span>

              <span>
                <b>Account 0</b>

                <small>
                  {roleLabels[role]}
                </small>
              </span>

              <span>
                ⌄
              </span>
            </button>

          </div>

        </header>

        <div className="page-content">
          {children}
        </div>

      </main>

    </div>
  );
}