import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import Timeline from "../components/Timeline";
import DataTable from "../components/DataTable";

import {
  getReadOnlyContract,
} from "../blockchain/contract";

import {
  useWallet,
} from "../context/WalletContext";


const STATUS_NAMES = {
  0: "ACTIVE",
  1: "SOLD",
  2: "RECALLED",
  3: "IN TRANSIT",
  4: "DELIVERED",
};


const ROLE_NAMES = {
  0: "NONE",
  1: "ADMIN",
  2: "MANUFACTURER",
  3: "DISTRIBUTOR",
  4: "RETAILER",
  5: "CUSTOMER",
};


function formatDate(timestamp) {
  if (!timestamp) {
    return "-";
  }

  const value = Number(timestamp);

  if (!value) {
    return "-";
  }

  return new Date(value * 1000).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}


function formatDateTime(timestamp) {
  if (!timestamp) {
    return {
      date: "-",
      time: "-",
    };
  }

  const value = Number(timestamp);

  if (!value) {
    return {
      date: "-",
      time: "-",
    };
  }

  const date = new Date(value * 1000);

  return {
    date: date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    ),
    time: date.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    ),
  };
}


function shortenAddress(address) {
  if (!address) {
    return "-";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}


function getStatusTone(status) {
  switch (status) {
    case "ACTIVE":
      return "active";

    case "IN TRANSIT":
      return "in-transit";

    case "DELIVERED":
      return "delivered";

    case "RECALLED":
      return "recalled";

    case "SOLD":
      return "sold";

    default:
      return "";
  }
}


const ROLE_CONFIG = {

  admin: {
    title: "Admin Dashboard",

    description:
      "Monitor FoodTrace organizations, products, batches and blockchain activity.",

    actionText: "View organizations",

    actionPath: "/app/admin/organizations",
  },


  manufacturer: {
    title: "Manufacturer Dashboard",

    description:
      "Manage products, batches and authorized supply-chain transfers.",

    actionText: "Manage products",

    actionPath: "/app/products",
  },


  distributor: {
    title: "Distributor Dashboard",

    description:
      "Track incoming shipments and transfer verified batches to retailers.",

    actionText: "View batches",

    actionPath: "/app/batches",
  },


  retailer: {
    title: "Retailer Dashboard",

    description:
      "Receive batches, verify product history and manage retail-ready inventory.",

    actionText: "View batches",

    actionPath: "/app/batches",
  },


  customer: {
    title: "Customer Dashboard",

    description:
      "Verify food batches and view their blockchain-backed traceability history.",

    actionText: "Verify a batch",

    actionPath: "/verify",
  },

};


export default function DashboardPage({
  role,
}) {

  const {
    address,
  } = useWallet();


  const contract = useMemo(
    () => getReadOnlyContract(),
    []
  );


  const [organizations, setOrganizations] =
    useState([]);

  const [products, setProducts] =
    useState([]);

  const [batches, setBatches] =
    useState([]);

  const [activity, setActivity] =
    useState([]);


  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  /*
   * ============================================================
   * LOAD DASHBOARD DATA
   * ============================================================
   */

  const loadDashboard = useCallback(
    async () => {

      try {

        setLoading(true);
        setError("");


        /*
         * Get IDs from blockchain.
         */

        const [
          organizationIds,
          productIds,
          batchIds,
        ] = await Promise.all([

          contract.getOrganizationIds(),

          contract.getProductIds(),

          contract.getBatchIds(),

        ]);


        /*
         * Load organizations.
         */

        const organizationResults =
          await Promise.all(

            organizationIds.map(
              async (organizationId) => {

                const data =
                  await contract.getOrganization(
                    organizationId
                  );

                return {
                  id: data.organizationId,
                  name: data.name,
                  wallet: data.walletAddress,
                  role: Number(data.role),
                  roleName:
                    ROLE_NAMES[
                      Number(data.role)
                    ] || "UNKNOWN",
                  location: data.location,
                  active: data.active,
                };

              }
            )

          );


        /*
         * Load products.
         */

        const productResults =
          await Promise.all(

            productIds.map(
              async (productId) => {

                const data =
                  await contract.getProduct(
                    productId
                  );

                return {
                  id: data.productId,
                  name: data.name,
                  description: data.description,
                  category: data.category,
                  manufacturer:
                    data.manufacturer,
                  createdAt:
                    Number(data.createdAt),
                  active: data.active,
                };

              }
            )

          );


        /*
         * Load batches.
         */

        const batchResults =
          await Promise.all(

            batchIds.map(
              async (batchId) => {

                const data =
                  await contract.getBatch(
                    batchId
                  );

                return {
                  id: data.batchId,

                  productId:
                    data.productId,

                  quantity:
                    Number(data.quantity),

                  manufacturingDate:
                    Number(
                      data.manufacturingDate
                    ),

                  expiryDate:
                    Number(
                      data.expiryDate
                    ),

                  mrp:
                    Number(data.mrp),

                  currentOwner:
                    data.currentOwner,

                  status:
                    Number(data.status),

                  recalled:
                    data.recalled,

                  recallReason:
                    data.recallReason,

                  createdAt:
                    Number(data.createdAt),
                };

              }
            )

          );


        /*
         * Address → organization lookup.
         */

        const organizationByAddress =
          new Map();

        organizationResults.forEach(
          (organization) => {

            organizationByAddress.set(
              organization.wallet.toLowerCase(),
              organization
            );

          }
        );


        /*
         * Product lookup.
         */

        const productById =
          new Map();

        productResults.forEach(
          (product) => {

            productById.set(
              product.id,
              product
            );

          }
        );


        /*
         * Load batch histories.
         */

        const historyResults =
          await Promise.all(

            batchResults.map(
              async (batch) => {

                const history =
                  await contract.getBatchHistory(
                    batch.id
                  );

                return history.map(
                  (event) => {

                    const eventTime =
                      Number(
                        event.timestamp
                      );

                    const actor =
                      organizationByAddress.get(
                        event.actor.toLowerCase()
                      );

                    const formatted =
                      formatDateTime(
                        eventTime
                      );

                    return {

                      id:
                        `${batch.id}-${eventTime}-${event.eventType}`,

                      batchId:
                        batch.id,

                      date:
                        formatted.date,

                      time:
                        formatted.time,

                      event:
                        event.eventType,

                      actor:
                        actor?.name ||
                        shortenAddress(
                          event.actor
                        ),

                      location:
                        event.location ||
                        "-",

                      status:
                        "Completed",

                      timestamp:
                        eventTime,

                    };

                  }
                );

              }
            )

          );


        const flattenedHistory =
          historyResults
            .flat()
            .sort(
              (a, b) =>
                b.timestamp -
                a.timestamp
            );


        /*
         * Enrich batches with product/owner names.
         */

        const enrichedBatches =
          batchResults.map(
            (batch) => {

              const product =
                productById.get(
                  batch.productId
                );

              const owner =
                organizationByAddress.get(
                  batch.currentOwner.toLowerCase()
                );

              return {

                ...batch,

                product:
                  product?.name ||
                  batch.productId,

                owner:
                  owner?.name ||
                  shortenAddress(
                    batch.currentOwner
                  ),

                ownerRole:
                  owner?.roleName ||
                  "UNKNOWN",

                statusName:
                  batch.recalled
                    ? "RECALLED"
                    : (
                        STATUS_NAMES[
                          batch.status
                        ] || "UNKNOWN"
                      ),

              };

            }
          );


        setOrganizations(
          organizationResults
        );

        setProducts(
          productResults
        );

        setBatches(
          enrichedBatches
        );

        setActivity(
          flattenedHistory
        );


      } catch (err) {

        console.error(
          "Failed to load dashboard:",
          err
        );

        setError(
          err?.message ||
          "Failed to load dashboard data."
        );

      } finally {

        setLoading(false);

      }

    },
    [contract]
  );


  useEffect(
    () => {

      loadDashboard();

    },
    [loadDashboard]
  );


  /*
   * ============================================================
   * ROLE-SPECIFIC DATA
   * ============================================================
   */

  const walletAddress =
    address?.toLowerCase();


  const myBatches =
    walletAddress

      ? batches.filter(
          (batch) =>
            batch.currentOwner?.toLowerCase() ===
            walletAddress
        )

      : [];


  const myProducts =
    walletAddress

      ? products.filter(
          (product) =>
            product.manufacturer?.toLowerCase() ===
            walletAddress
        )

      : [];


  const visibleBatches =
    role === "admin"

      ? batches

      : myBatches;


  const visibleActivity =
    role === "admin"

      ? activity

      : activity.filter(
          (item) => {

            const batch =
              batches.find(
                (entry) =>
                  entry.id ===
                  item.batchId
              );

            if (!batch) {
              return false;
            }

            return (
              batch.currentOwner?.toLowerCase() ===
              walletAddress
            );

          }
        );


  /*
   * ============================================================
   * STATS
   * ============================================================
   */

  const stats = useMemo(
    () => {

      if (role === "admin") {

        return [

          [
            "Organizations",
            organizations.length,
            "Registered on-chain",
            "◉",
          ],

          [
            "Products",
            products.length,
            "Registered products",
            "□",
          ],

          [
            "Active Batches",
            batches.filter(
              (batch) =>
                batch.statusName ===
                "ACTIVE"
            ).length,
            "Currently active",
            "◫",
          ],

          [
            "Blockchain Events",
            activity.length,
            "Recorded batch events",
            "↗",
          ],

        ];

      }


      if (role === "manufacturer") {

        return [

          [
            "Products",
            myProducts.length,
            "Created by you",
            "□",
          ],

          [
            "Active Batches",
            myBatches.filter(
              (batch) =>
                batch.statusName ===
                "ACTIVE"
            ).length,
            "Currently owned",
            "◫",
          ],

          [
            "In Transit",
            myBatches.filter(
              (batch) =>
                batch.statusName ===
                "IN TRANSIT"
            ).length,
            "Currently in transit",
            "→",
          ],

          [
            "Recalled",
            myBatches.filter(
              (batch) =>
                batch.statusName ===
                "RECALLED"
            ).length,
            "Requires attention",
            "⚠",
          ],

        ];

      }


      if (role === "distributor") {

        return [

          [
            "Incoming",
            myBatches.filter(
              (batch) =>
                batch.statusName ===
                "IN TRANSIT"
            ).length,
            "Batches in transit",
            "↓",
          ],

          [
            "In Transit",
            myBatches.filter(
              (batch) =>
                batch.statusName ===
                "IN TRANSIT"
            ).length,
            "Currently held",
            "→",
          ],

          [
            "Received",
            myBatches.filter(
              (batch) =>
                batch.statusName ===
                "DELIVERED"
            ).length,
            "Delivered batches",
            "✓",
          ],

          [
            "Active Batches",
            myBatches.filter(
              (batch) =>
                batch.statusName ===
                "ACTIVE"
            ).length,
            "Currently owned",
            "◫",
          ],

        ];

      }


      if (role === "retailer") {

        return [

          [
            "Received",
            myBatches.filter(
              (batch) =>
                batch.statusName ===
                "DELIVERED"
            ).length,
            "Delivered batches",
            "✓",
          ],

          [
            "Available",
            myBatches.filter(
              (batch) =>
                batch.statusName ===
                "DELIVERED" ||
                batch.statusName ===
                "ACTIVE"
            ).length,
            "Retail-ready inventory",
            "◫",
          ],

          [
            "Pending",
            myBatches.filter(
              (batch) =>
                batch.statusName ===
                "IN TRANSIT"
            ).length,
            "Awaiting delivery",
            "↓",
          ],

          [
            "Recalled",
            myBatches.filter(
              (batch) =>
                batch.statusName ===
                "RECALLED"
            ).length,
            "Remove from sale",
            "⚠",
          ],

        ];

      }


      if (role === "customer") {

        return [

          [
            "Purchased",
            myBatches.filter(
              (batch) =>
                batch.statusName ===
                "SOLD"
            ).length,
            "Blockchain purchases",
            "✓",
          ],

          [
            "Verified",
            myBatches.length,
            "Owned batches",
            "◉",
          ],

          [
            "Recalled",
            myBatches.filter(
              (batch) =>
                batch.statusName ===
                "RECALLED"
            ).length,
            "Recall warnings",
            "⚠",
          ],

          [
            "History Events",
            visibleActivity.length,
            "Traceability events",
            "↗",
          ],

        ];

      }


      return [];

    },
    [
      role,
      organizations,
      products,
      batches,
      activity,
      myProducts,
      myBatches,
      visibleActivity,
    ]
  );


  /*
   * ============================================================
   * BATCH STATUS COUNTS
   * ============================================================
   */

  const statusCounts = useMemo(
    () => {

      const total =
        visibleBatches.length || 1;


      const statuses = [

        [
          "Active",
          "ACTIVE",
          "active",
        ],

        [
          "In transit",
          "IN TRANSIT",
          "in-transit",
        ],

        [
          "Delivered",
          "DELIVERED",
          "delivered",
        ],

        [
          "Recalled",
          "RECALLED",
          "recalled",
        ],

        [
          "Sold",
          "SOLD",
          "sold",
        ],

      ];


      return statuses.map(
        ([label, status, tone]) => {

          const count =
            visibleBatches.filter(
              (batch) =>
                batch.statusName ===
                status
            ).length;


          return {

            label,

            count,

            tone,

            percentage:
              Math.round(
                (count / total) *
                100
              ),

          };

        }
      );

    },
    [visibleBatches]
  );


  const recentBatches =
    [...visibleBatches]
      .sort(
        (a, b) =>
          b.createdAt -
          a.createdAt
      )
      .slice(0, 5);


  const recentActivity =
    visibleActivity.slice(0, 5);


  const config =
    ROLE_CONFIG[role] ||
    ROLE_CONFIG.manufacturer;


  /*
   * ============================================================
   * UI
   * ============================================================
   */

  return (

    <AppShell role={role}>

      <PageHeader

        eyebrow="OVERVIEW"

        title={
          config.title
        }

        description={
          config.description
        }

        action={

          <Link
            className="button button-primary"
            to={
              config.actionPath
            }
          >
            {config.actionText}
            {" →"}
          </Link>

        }

      />


      {error && (

        <div
          className="panel"
          style={{
            marginBottom: "20px",
            color: "#c0392b",
          }}
        >
          {error}
        </div>

      )}


      {loading ? (

        <div className="panel">

          <p>
            Loading live blockchain
            dashboard...
          </p>

        </div>

      ) : (

        <>

          {/* ==================================================
              STATS
          ================================================== */}

          <div className="stats-grid">

            {stats.map(
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


          {/* ==================================================
              ACTIVITY + STATUS
          ================================================== */}

          <div className="dashboard-grid">


            <section className="panel">

              <div className="panel-header">

                <div>

                  <h2>
                    Recent activity
                  </h2>

                  <p>
                    Latest blockchain
                    supply-chain events
                  </p>

                </div>


                <Link
                  to="/app/history"
                  className="text-link"
                >
                  View all →
                </Link>

              </div>


              {recentActivity.length >
              0 ? (

                <Timeline
                  items={
                    recentActivity
                  }
                />

              ) : (

                <p>
                  No blockchain activity
                  available yet.
                </p>

              )}

            </section>


            <section className="panel">

              <div className="panel-header">

                <div>

                  <h2>
                    Batch status
                  </h2>

                  <p>
                    Current blockchain
                    overview
                  </p>

                </div>

              </div>


              <div className="status-bars">

                {statusCounts.map(
                  ({
                    label,
                    count,
                    tone,
                    percentage,
                  }) => (

                    <div
                      className="status-bar-row"
                      key={label}
                    >

                      <div>

                        <span>
                          {label}
                        </span>

                        <strong>
                          {count}
                        </strong>

                      </div>


                      <div className="bar">

                        <span
                          className={
                            tone
                          }
                          style={{
                            width:
                              `${percentage}%`,
                          }}
                        />

                      </div>

                    </div>

                  )
                )}

              </div>

            </section>

          </div>


          {/* ==================================================
              RECENT BATCHES
          ================================================== */}

          <section className="panel">

            <div className="panel-header">

              <div>

                <h2>
                  Recent batches
                </h2>

                <p>
                  Latest batch records
                  from FoodTrace
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

                  render: (row) => (

                    <Link
                      className="table-link"
                      to={
                        `/app/batches/${row.id}`
                      }
                    >
                      {row.id}
                    </Link>

                  ),
                },


                {
                  key: "product",
                  label: "Product",
                },


                {
                  key: "quantity",
                  label: "Quantity",

                  render: (row) =>
                    row.quantity.toLocaleString(
                      "en-IN"
                    ),
                },


                {
                  key: "owner",
                  label: "Current owner",
                },


                {
                  key: "statusName",
                  label: "Status",

                  render: (row) => (

                    <StatusBadge
                      tone={
                        getStatusTone(
                          row.statusName
                        )
                      }
                    >
                      {row.statusName}
                    </StatusBadge>

                  ),
                },

              ]}

              rows={
                recentBatches
              }

            />

          </section>


          {/* ==================================================
              QUICK BLOCKCHAIN SUMMARY
          ================================================== */}

          <section className="panel">

            <div className="panel-header">

              <div>

                <h2>
                  Blockchain summary
                </h2>

                <p>
                  Live FoodTrace network
                  information
                </p>

              </div>

            </div>


            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "16px",
              }}
            >

              <div>

                <small>
                  Organizations
                </small>

                <strong
                  style={{
                    display: "block",
                    marginTop: "6px",
                    fontSize: "24px",
                  }}
                >
                  {organizations.length}
                </strong>

              </div>


              <div>

                <small>
                  Products
                </small>

                <strong
                  style={{
                    display: "block",
                    marginTop: "6px",
                    fontSize: "24px",
                  }}
                >
                  {products.length}
                </strong>

              </div>


              <div>

                <small>
                  Batches
                </small>

                <strong
                  style={{
                    display: "block",
                    marginTop: "6px",
                    fontSize: "24px",
                  }}
                >
                  {batches.length}
                </strong>

              </div>


              <div>

                <small>
                  Recorded Events
                </small>

                <strong
                  style={{
                    display: "block",
                    marginTop: "6px",
                    fontSize: "24px",
                  }}
                >
                  {activity.length}
                </strong>

              </div>

            </div>

          </section>

        </>

      )}

    </AppShell>

  );

}