import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  Building2,
  Package,
  Boxes,
  ArrowUpRight,
  ArrowRight,
  AlertTriangle,
  History,
  ArrowDownToLine,
  QrCode,
  ShieldCheck,
  WalletCards,
  ChevronDown,
} from "lucide-react";

import { roleLabels } from "../data/mockData";
import { useWallet } from "../context/WalletContext";

const navByRole = {
  admin: [
    ["Dashboard", "/app/admin", LayoutDashboard],
    ["Organizations", "/app/admin/organizations", Building2],
    ["Products", "/app/products", Package],
    ["Batches", "/app/batches", Boxes],
    ["Transactions", "/app/admin/transactions", ArrowUpRight],
  ],

  manufacturer: [
    ["Dashboard", "/app/manufacturer", LayoutDashboard],
    ["Products", "/app/products", Package],
    ["Batches", "/app/batches", Boxes],
    ["Transfer Batch", "/app/transfer", ArrowRight],
    // ["Recall Batch", "/app/recall", AlertTriangle],
    ["History", "/app/history", History],
  ],

  distributor: [
    ["Dashboard", "/app/distributor", LayoutDashboard],
    ["Incoming Batches", "/app/batches", Boxes],
    ["Transfer Batch", "/app/transfer", ArrowRight],
    ["History", "/app/history", History],
  ],

  retailer: [
    ["Dashboard", "/app/retailer", LayoutDashboard],
    ["Batches", "/app/batches", Boxes],
    ["Receive Batch", "/app/transfer", ArrowDownToLine],
    //["QR Verification", "/verify/BATCH-2026-001", QrCode],
    ["History", "/app/history", History],
  ],
};

function shortenAddress(address) {
  if (!address) {
    return "Not connected";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function AppShell({
  role: roleProp = "manufacturer",
  children,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    address,
    role: walletRole,
    isConnected,
  } = useWallet();

  const actualRole =
    walletRole?.name?.toLowerCase() ||
    roleProp;

  const links =
    navByRole[actualRole] ||
    navByRole.manufacturer;

  const displayRole =
    roleLabels[actualRole] ||
    walletRole?.name ||
    "Unknown";

  const displayAddress =
    shortenAddress(address);

  return (
    <div className="app-shell">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-mark">
            F
          </div>

          <div>
            <strong>
              FoodTrace
            </strong>

            <span>
              Supply Chain DApp
            </span>
          </div>
        </div>

        <div className="sidebar-section-label">
          Workspace
        </div>

        <nav className="side-nav">

          {links.map(
            ([label, href, Icon]) => (
              <NavLink
                key={label}
                to={href}
                className={() =>
                  `side-link ${
                    location.pathname === href
                      ? "active"
                      : ""
                  }`
                }
              >
                <span className="nav-icon">
                  <Icon
                    size={18}
                    strokeWidth={1.8}
                  />
                </span>

                <span>
                  {label}
                </span>
              </NavLink>
            )
          )}

        </nav>

        <div className="sidebar-bottom">

          {/* <NavLink
            className="side-link"
            to="/verify/BATCH-2026-001"
          >
            <span className="nav-icon">
              <ShieldCheck
                size={18}
                strokeWidth={1.8}
              />
            </span>

            Public Verification
          </NavLink> */}

          <button
            className="wallet-mini"
            onClick={() =>
              navigate("/wallet")
            }
          >
            <span className="status-dot" />

            <span>
              <b>
                {isConnected
                  ? "Wallet connected"
                  : "Wallet disconnected"}
              </b>

              <small>
                {displayAddress}
              </small>
            </span>
          </button>

        </div>

      </aside>

      {/* MAIN */}

      <main className="main-area">

        <header className="topbar">

          <div className="breadcrumbs">

            <span>
              FoodTrace
            </span>

            <span>
              /
            </span>

            <b>
              {displayRole}
            </b>

          </div>

          <div className="top-actions">

            <button
              className="icon-button"
              aria-label="Wallet"
              onClick={() =>
                navigate("/wallet")
              }
            >
              <WalletCards
                size={19}
                strokeWidth={1.8}
              />
            </button>

            <button
              className="profile-chip"
              onClick={() =>
                navigate("/wallet")
              }
            >
              <span className="avatar">
                {displayRole.charAt(0)}
              </span>

              <span>
                <b>
                  {displayRole}
                </b>

                <small>
                  {displayAddress}
                </small>
              </span>

              <ChevronDown
                size={16}
                strokeWidth={1.8}
              />
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