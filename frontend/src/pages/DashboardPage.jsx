import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import Timeline from "../components/Timeline";
import DataTable from "../components/DataTable";
import {
  batches,
  history,
  transactions,
} from "../data/mockData";

const roleConfig = {

  admin: {
    title: "Admin Dashboard",
    description:
      "Monitor FoodTrace participants, products, batches and blockchain activity.",

    stats: [
      ["Organizations", "24", "+4 this month", "◉"],
      ["Products", "86", "+12 this month", "□"],
      ["Active Batches", "248", "+18 this week", "◫"],
      ["Transactions", "1,842", "+126 this week", "↗"],
    ],
  },

  manufacturer: {
    title: "Manufacturer Dashboard",
    description:
      "Manage products, create batches and control authorized supply-chain transfers.",

    stats: [
      ["Products", "12", "+2 this month", "□"],
      ["Active Batches", "48", "+6 this week", "◫"],
      ["In Transit", "9", "3 arriving today", "→"],
      ["Recalled", "2", "Requires attention", "⚠"],
    ],
  },

  distributor: {
    title: "Distributor Dashboard",
    description:
      "Track incoming shipments and transfer verified batches to retailers.",

    stats: [
      ["Incoming", "14", "5 arriving today", "↓"],
      ["In Transit", "9", "2 delayed", "→"],
      ["Received", "126", "+18 this month", "✓"],
      ["Active Batches", "82", "+7 this week", "◫"],
    ],
  },

  retailer: {
    title: "Retailer Dashboard",
    description:
      "Receive batches, verify product history and manage retail-ready inventory.",

    stats: [
      ["Received", "72", "+9 this month", "✓"],
      ["Available", "58", "Retail-ready", "◫"],
      ["Pending", "6", "Awaiting receipt", "↓"],
      ["Recalled", "1", "Remove from sale", "⚠"],
    ],
  },
};

export default function DashboardPage({
  role,
}) {

  const config = roleConfig[role];

  return (
    <AppShell role={role}>

      <PageHeader
        eyebrow="OVERVIEW"
        title={config.title}
        description={config.description}
        action={
          <Link
            className="button button-primary"
            to={
              role === "manufacturer"
                ? "/app/products"
                : "/app/batches"
            }
          >
            {role === "manufacturer"
              ? "Manage products"
              : "View batches"}
            {" →"}
          </Link>
        }
      />

      {/* STATS */}

      <div className="stats-grid">

        {config.stats.map(
          ([
            label,
            value,
            change,
            icon,
          ]) => (
            <StatCard
              key={label}
              label={label}
              value={value}
              change={change}
              icon={icon}
            />
          )
        )}

      </div>

      {/* DASHBOARD GRID */}

      <div className="dashboard-grid">

        <section className="panel">

          <div className="panel-header">

            <div>

              <h2>
                Recent activity
              </h2>

              <p>
                Latest supply-chain events
              </p>

            </div>

            <Link
              to="/app/history"
              className="text-link"
            >
              View all →
            </Link>

          </div>

          <Timeline
            items={history.slice(0, 4)}
          />

        </section>

        <section className="panel">

          <div className="panel-header">

            <div>

              <h2>
                Batch status
              </h2>

              <p>
                Current overview
              </p>

            </div>

          </div>

          <div className="status-bars">

            {[
              ["Active", 72, "active"],
              ["In transit", 18, "in-transit"],
              ["Delivered", 28, "delivered"],
              ["Recalled", 4, "recalled"],
            ].map(
              ([
                label,
                count,
                tone,
              ]) => (

                <div
                  className="status-bar-row"
                  key={label}
                >

                  <div>
                    <span>{label}</span>
                    <strong>{count}</strong>
                  </div>

                  <div className="bar">

                    <span
                      className={tone}
                      style={{
                        width: `${count}%`,
                      }}
                    />

                  </div>

                </div>

              )
            )}

          </div>

        </section>

      </div>

      {/* BATCHES */}

      <section className="panel">

        <div className="panel-header">

          <div>

            <h2>
              Recent batches
            </h2>

            <p>
              Latest batch records
            </p>

          </div>

          <Link
            to="/app/batches"
            className="text-link"
          >
            View all →
          </Link>

        </div>

        <DataTable
          columns={[
            {
              key: "id",
              label: "Batch ID",
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
          rows={batches.slice(0, 4)}
        />

      </section>

      {/* TRANSACTIONS */}

      <section className="panel">

        <div className="panel-header">

          <div>

            <h2>
              Latest transactions
            </h2>

            <p>
              Blockchain activity
            </p>

          </div>

          <Link
            to="/app/admin/transactions"
            className="text-link"
          >
            View transactions →
          </Link>

        </div>

        <DataTable
          columns={[
            {
              key: "hash",
              label: "Transaction",
            },
            {
              key: "event",
              label: "Event",
            },
            {
              key: "entity",
              label: "Entity",
            },
            {
              key: "actor",
              label: "Actor",
            },
            {
              key: "status",
              label: "Status",
              render: (row) => (
                <StatusBadge tone="confirmed">
                  {row.status}
                </StatusBadge>
              ),
            },
          ]}
          rows={transactions}
        />

      </section>

    </AppShell>
  );
}