import {
  useCallback,
  useEffect,
  useState,
} from "react";

import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";

import {
  getReadOnlyContract,
} from "../blockchain/contract";

import { useWallet } from "../context/WalletContext";

const STATUS_LABELS = {
  0: "ACTIVE",
  1: "SOLD",
  2: "RECALLED",
  3: "IN TRANSIT",
  4: "DELIVERED",
};

function formatDate(timestamp) {
  if (!timestamp) {
    return "—";
  }

  return new Date(
    Number(timestamp) * 1000
  ).toLocaleString();
}

function shortenAddress(address) {
  if (!address) {
    return "—";
  }

  return `${address.slice(
    0,
    6
  )}...${address.slice(-4)}`;
}

export default function HistoryPage({
  role = "manufacturer",
}) {
  // ============================================================
  // WALLET
  // ============================================================

  const {
    address,
    role: walletRole,
  } = useWallet();

  // ============================================================
  // CONTRACT
  // ============================================================

  const [contract] = useState(() =>
    getReadOnlyContract()
  );

  // ============================================================
  // BATCHES
  // ============================================================

  const [batchIds, setBatchIds] =
    useState([]);

  const [
    selectedBatchId,
    setSelectedBatchId,
  ] = useState("");

  const [batch, setBatch] =
    useState(null);

  const [product, setProduct] =
    useState(null);

  const [history, setHistory] =
    useState([]);

  // ============================================================
  // STATE
  // ============================================================

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ============================================================
  // ROLE HELPERS
  // ============================================================

  const isDistributor =
    walletRole?.name ===
    "DISTRIBUTOR";

  const isRetailer =
    walletRole?.name ===
    "RETAILER";

  // ============================================================
  // LOAD BATCH IDS
  // ============================================================
  //
  // Important:
  //
  // We do NOT simply load every batch ID anymore.
  //
  // For distributor:
  //     currentOwner == wallet
  //     AND status == IN_TRANSIT
  //
  // For retailer:
  //     currentOwner == wallet
  //     AND status == DELIVERED
  //
  // Manufacturer/Admin:
  //     all batches
  //
  // ============================================================

  const loadBatchIds =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const ids =
          await contract.getBatchIds();

        // --------------------------------------------------------
        // ADMIN / MANUFACTURER
        // --------------------------------------------------------

        if (
          !isDistributor &&
          !isRetailer
        ) {
          setBatchIds(ids);

          if (ids.length > 0) {
            setSelectedBatchId(
              (currentSelected) => {
                if (
                  currentSelected &&
                  ids.includes(
                    currentSelected
                  )
                ) {
                  return currentSelected;
                }

                return ids[0];
              }
            );
          } else {
            setSelectedBatchId("");
          }

          return;
        }

        // --------------------------------------------------------
        // DISTRIBUTOR / RETAILER
        // --------------------------------------------------------

        if (!address) {
          setBatchIds([]);
          setSelectedBatchId("");
          return;
        }

        const walletAddress =
          address.toLowerCase();

        const allowedBatches =
          [];

        for (const batchId of ids) {
          try {
            const batchData =
              await contract.getBatch(
                batchId
              );

            const currentOwner =
              batchData.currentOwner?.toLowerCase();

            const status =
              Number(
                batchData.status
              );

            // ----------------------------------------------------
            // DISTRIBUTOR
            // ----------------------------------------------------

            if (
              isDistributor &&
              currentOwner ===
                walletAddress &&
              status === 3
            ) {
              allowedBatches.push(
                batchId
              );
            }

            // ----------------------------------------------------
            // RETAILER
            // ----------------------------------------------------

            if (
              isRetailer &&
              currentOwner ===
                walletAddress &&
              status === 4
            ) {
              allowedBatches.push(
                batchId
              );
            }
          } catch (batchError) {
            console.warn(
              `Could not load batch ${batchId}:`,
              batchError
            );
          }
        }

        setBatchIds(
          allowedBatches
        );

        // --------------------------------------------------------
        // Keep currently selected batch if it is still allowed.
        // Otherwise select the first allowed batch.
        // --------------------------------------------------------

        setSelectedBatchId(
          (currentSelected) => {
            if (
              currentSelected &&
              allowedBatches.includes(
                currentSelected
              )
            ) {
              return currentSelected;
            }

            return (
              allowedBatches[0] || ""
            );
          }
        );
      } catch (err) {
        console.error(
          "Failed to load batch IDs:",
          err
        );

        setBatchIds([]);
        setSelectedBatchId("");

        setError(
          err?.shortMessage ||
            err?.message ||
            "Failed to load batch IDs."
        );
      } finally {
        setLoading(false);
      }
    }, [
      contract,
      address,
      isDistributor,
      isRetailer,
    ]);

  // ============================================================
  // LOAD SELECTED BATCH HISTORY
  // ============================================================

  const loadHistory =
    useCallback(
      async (batchId) => {
        if (!batchId) {
          setBatch(null);
          setProduct(null);
          setHistory([]);
          return;
        }

        try {
          setLoading(true);
          setError("");

          // ------------------------------------------------------
          // Get batch
          // ------------------------------------------------------

          const batchData =
            await contract.getBatch(
              batchId
            );

          // ------------------------------------------------------
          // SECURITY CHECK
          // ------------------------------------------------------
          //
          // Even though the dropdown is filtered, check again
          // before loading the history.
          //
          // This prevents an old selected batch from being shown
          // after the wallet role/account changes.
          // ------------------------------------------------------

          if (
            isDistributor ||
            isRetailer
          ) {
            if (!address) {
              setBatch(null);
              setProduct(null);
              setHistory([]);

              setError(
                "Connect your wallet to view batch history."
              );

              return;
            }

            const currentOwner =
              batchData.currentOwner?.toLowerCase();

            const status =
              Number(
                batchData.status
              );

            const isAllowedForDistributor =
              isDistributor &&
              currentOwner ===
                address.toLowerCase() &&
              status === 3;

            const isAllowedForRetailer =
              isRetailer &&
              currentOwner ===
                address.toLowerCase() &&
              status === 4;

            if (
              !isAllowedForDistributor &&
              !isAllowedForRetailer
            ) {
              setBatch(null);
              setProduct(null);
              setHistory([]);

              setError(
                "This batch is not currently assigned to your organization."
              );

              return;
            }
          }

          // ------------------------------------------------------
          // Load product + history
          // ------------------------------------------------------

          const [
            productData,
            historyData,
          ] = await Promise.all([
            contract.getProduct(
              batchData.productId
            ),

            contract.getBatchHistory(
              batchId
            ),
          ]);

          setBatch(batchData);
          setProduct(productData);

          // ------------------------------------------------------
          // Resolve history actors
          // ------------------------------------------------------

          const formattedHistory =
            await Promise.all(
              historyData.map(
                async (
                  item,
                  index
                ) => {
                  let actorOrganization =
                    null;

                  try {
                    const organizationId =
                      await contract.organizationIdByAddress(
                        item.actor
                      );

                    if (
                      organizationId
                    ) {
                      actorOrganization =
                        await contract.getOrganization(
                          organizationId
                        );
                    }
                  } catch (
                    orgError
                  ) {
                    console.warn(
                      "Could not resolve actor organization:",
                      orgError
                    );
                  }

                  return {
                    id: index,

                    eventType:
                      item.eventType,

                    actor:
                      item.actor,

                    timestamp:
                      item.timestamp,

                    location:
                      item.location,

                    notes:
                      item.notes,

                    organization:
                      actorOrganization?.name ||
                      null,

                    organizationRole:
                      actorOrganization
                        ? Number(
                            actorOrganization.role
                          )
                        : null,
                  };
                }
              )
            );

          setHistory(
            formattedHistory
          );
        } catch (err) {
          console.error(
            "Failed to load batch history:",
            err
          );

          setBatch(null);
          setProduct(null);
          setHistory([]);

          setError(
            err?.shortMessage ||
              err?.message ||
              "Failed to load batch history."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        contract,
        address,
        isDistributor,
        isRetailer,
      ]
    );

  // ============================================================
  // LOAD BATCHES WHEN PAGE / WALLET / ROLE CHANGES
  // ============================================================

  useEffect(() => {
    loadBatchIds();
  }, [loadBatchIds]);

  // ============================================================
  // LOAD HISTORY WHEN SELECTED BATCH CHANGES
  // ============================================================

  useEffect(() => {
    if (selectedBatchId) {
      loadHistory(
        selectedBatchId
      );
    } else {
      setBatch(null);
      setProduct(null);
      setHistory([]);
    }
  }, [
    selectedBatchId,
    loadHistory,
  ]);

  // ============================================================
  // ROLE-SPECIFIC PAGE TEXT
  // ============================================================

  let pageTitle =
    "Supply-chain history";

  let pageDescription =
    "A chronological view of recorded product and batch events from the blockchain.";

  if (isDistributor) {
    pageTitle =
      "Incoming batch history";

    pageDescription =
      "View blockchain history for batches currently in transit to your distribution organization.";
  }

  if (isRetailer) {
    pageTitle =
      "Incoming batch history";

    pageDescription =
      "View blockchain history for batches currently delivered to your retail organization.";
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <AppShell role={role}>
      <PageHeader
        eyebrow="TRACEABILITY"
        title={pageTitle}
        description={
          pageDescription
        }
      />

      {/* ======================================================
          ERROR
          ====================================================== */}

      {error && (
        <div
          className="panel"
          style={{
            marginBottom: 20,
          }}
        >
          <p
            style={{
              color: "#dc2626",
            }}
          >
            {error}
          </p>
        </div>
      )}

      {/* ======================================================
          ROLE INFO
          ====================================================== */}

      {(isDistributor ||
        isRetailer) && (
        <div
          className="panel"
          style={{
            marginBottom: 20,
            padding: "14px 18px",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#475569",
              fontSize: "14px",
            }}
          >
            {isDistributor
              ? "Only batches currently in transit to your distributor wallet are shown."
              : "Only batches currently delivered to your retailer wallet are shown."}
          </p>
        </div>
      )}

      {/* ======================================================
          BATCH SELECTOR
          ====================================================== */}

      <div
        className="panel"
        style={{
          marginBottom: 20,
        }}
      >
        <div className="panel-header">
          <div>
            <h2>
              Select batch
            </h2>

            <p>
              {isDistributor
                ? "View the immutable history of batches currently assigned to you."
                : isRetailer
                ? "View the immutable history of batches currently delivered to you."
                : "View the immutable history recorded for a batch."}
            </p>
          </div>

          <select
            value={
              selectedBatchId
            }
            onChange={(event) =>
              setSelectedBatchId(
                event.target.value
              )
            }
            disabled={
              batchIds.length ===
              0
            }
            style={{
              padding:
                "10px 14px",
              borderRadius:
                "8px",
              border:
                "1px solid #d1d5db",
              background:
                "white",
              minWidth:
                "220px",
            }}
          >
            {batchIds.length ===
            0 ? (
              <option value="">
                {isDistributor
                  ? "No incoming batches"
                  : isRetailer
                  ? "No delivered batches"
                  : "No batches found"}
              </option>
            ) : (
              batchIds.map(
                (id) => (
                  <option
                    key={id}
                    value={id}
                  >
                    {id}
                  </option>
                )
              )
            )}
          </select>
        </div>
      </div>

      {/* ======================================================
          LOADING
          ====================================================== */}

      {loading ? (
        <div className="panel">
          <p>
            Loading blockchain
            history...
          </p>
        </div>
      ) : !batch ? (
        <div className="panel">
          <p>
            {isDistributor
              ? "No batches are currently in transit to your distributor wallet."
              : isRetailer
              ? "No batches are currently delivered to your retailer wallet."
              : "No batch data found."}
          </p>
        </div>
      ) : (
        <div className="history-layout">

          {/* ==================================================
              HISTORY TIMELINE
              ================================================== */}

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>
                  {batch.batchId}
                </h2>

                <p>
                  {product?.name ||
                    batch.productId}
                  {" · "}
                  {batch.quantity.toString()}{" "}
                  units
                </p>
              </div>

              <span className="status-badge active">
                {STATUS_LABELS[
                  Number(
                    batch.status
                  )
                ] ||
                  "UNKNOWN"}
              </span>
            </div>

            {history.length ===
            0 ? (
              <div
                style={{
                  padding:
                    "20px 0",
                }}
              >
                <p>
                  No history recorded
                  for this batch.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  gap: "18px",
                  marginTop:
                    "20px",
                }}
              >
                {history.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={
                        item.id
                      }
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "32px 1fr",
                        gap: "14px",
                      }}
                    >
                      {/* TIMELINE NUMBER */}

                      <div
                        style={{
                          display:
                            "flex",
                          flexDirection:
                            "column",
                          alignItems:
                            "center",
                        }}
                      >
                        <span
                          style={{
                            width:
                              "30px",
                            height:
                              "30px",
                            borderRadius:
                              "50%",
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            background:
                              "#111827",
                            color:
                              "white",
                            fontSize:
                              "13px",
                            fontWeight:
                              600,
                          }}
                        >
                          {index +
                            1}
                        </span>

                        {index <
                          history.length -
                            1 && (
                          <span
                            style={{
                              width:
                                "2px",
                              flex: 1,
                              marginTop:
                                "6px",
                              background:
                                "#e5e7eb",
                            }}
                          />
                        )}
                      </div>

                      {/* EVENT DETAILS */}

                      <div
                        style={{
                          paddingBottom:
                            "10px",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            gap:
                              "12px",
                            flexWrap:
                              "wrap",
                          }}
                        >
                          <div>
                            <h3
                              style={{
                                margin: 0,
                              }}
                            >
                              {
                                item.eventType
                              }
                            </h3>

                            {item.organization && (
                              <p
                                style={{
                                  margin:
                                    "5px 0 0",
                                  fontWeight:
                                    600,
                                }}
                              >
                                {
                                  item.organization
                                }
                              </p>
                            )}
                          </div>

                          <span
                            style={{
                              fontSize:
                                "13px",
                              color:
                                "#6b7280",
                            }}
                          >
                            {formatDate(
                              item.timestamp
                            )}
                          </span>
                        </div>

                        {/* LOCATION */}

                        {item.location && (
                          <p
                            style={{
                              margin:
                                "8px 0 0",
                              color:
                                "#4b5563",
                            }}
                          >
                            {
                              item.location
                            }
                          </p>
                        )}

                        {/* NOTES */}

                        {item.notes && (
                          <p
                            style={{
                              margin:
                                "6px 0 0",
                              color:
                                "#4b5563",
                            }}
                          >
                            {
                              item.notes
                            }
                          </p>
                        )}

                        {/* ACTOR WALLET */}

                        <p
                          style={{
                            margin:
                              "8px 0 0",
                            fontSize:
                              "12px",
                            color:
                              "#9ca3af",
                          }}
                        >
                          Actor:{" "}
                          {shortenAddress(
                            item.actor
                          )}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>

          {/* ==================================================
              BATCH SUMMARY
              ================================================== */}

          <aside className="panel">
            <div className="panel-header">
              <div>
                <h2>
                  Batch summary
                </h2>

                <p>
                  Current blockchain
                  state
                </p>
              </div>
            </div>

            <div className="journey-summary">

              {/* PRODUCT */}

              <div className="journey-node">
                <span>
                  1
                </span>

                <div>
                  <strong>
                    {product?.name ||
                      batch.productId}
                  </strong>

                  <small>
                    Product
                  </small>
                </div>
              </div>

              {/* BATCH */}

              <div className="journey-node">
                <span>
                  2
                </span>

                <div>
                  <strong>
                    {batch.batchId}
                  </strong>

                  <small>
                    Batch
                  </small>
                </div>
              </div>

              {/* QUANTITY */}

              <div className="journey-node">
                <span>
                  3
                </span>

                <div>
                  <strong>
                    {batch.quantity.toString()}
                  </strong>

                  <small>
                    Units
                  </small>
                </div>
              </div>

              {/* STATUS */}

              <div className="journey-node">
                <span>
                  4
                </span>

                <div>
                  <strong>
                    {STATUS_LABELS[
                      Number(
                        batch.status
                      )
                    ] ||
                      "UNKNOWN"}
                  </strong>

                  <small>
                    Current status
                  </small>
                </div>
              </div>

            </div>
          </aside>
        </div>
      )}
    </AppShell>
  );
}