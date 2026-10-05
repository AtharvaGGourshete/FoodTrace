import {
  useCallback,
  useEffect,
  useState,
} from "react";

import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import { getReadOnlyContract } from "../blockchain/contract";

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

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function HistoryPage({
  role = "manufacturer",
}) {
  const [contract] = useState(() =>
    getReadOnlyContract()
  );

  const [batchIds, setBatchIds] = useState([]);
  const [selectedBatchId, setSelectedBatchId] =
    useState("BATCH-2026-001");

  const [batch, setBatch] = useState(null);
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * Load all available batch IDs
   */
  const loadBatchIds = useCallback(async () => {
    try {
      setError("");

      const ids = await contract.getBatchIds();

      setBatchIds(ids);

      if (
        ids.length > 0 &&
        !ids.includes(selectedBatchId)
      ) {
        setSelectedBatchId(ids[0]);
      }
    } catch (err) {
      console.error(
        "Failed to load batch IDs:",
        err
      );

      setError(
        err?.shortMessage ||
          err?.message ||
          "Failed to load batch IDs."
      );
    }
  }, [contract, selectedBatchId]);

  /*
   * Load selected batch + product + blockchain history
   */
  const loadHistory = useCallback(
    async (batchId) => {
      try {
        setLoading(true);
        setError("");

        /*
         * First get the batch because we need
         * batch.productId to load the product.
         */
        const batchData =
          await contract.getBatch(batchId);

        /*
         * Product and history can be loaded
         * at the same time.
         */
        const [productData, historyData] =
          await Promise.all([
            contract.getProduct(
              batchData.productId
            ),
            contract.getBatchHistory(batchId),
          ]);

        setBatch(batchData);
        setProduct(productData);

        /*
         * Resolve each history actor to an
         * organization name where possible.
         */
        const formattedHistory =
          await Promise.all(
            historyData.map(
              async (item, index) => {
                let actorOrganization = null;

                try {
                  const organizationId =
                    await contract.organizationIdByAddress(
                      item.actor
                    );

                  if (organizationId) {
                    actorOrganization =
                      await contract.getOrganization(
                        organizationId
                      );
                  }
                } catch (orgError) {
                  console.warn(
                    "Could not resolve actor organization:",
                    orgError
                  );
                }

                return {
                  id: index,
                  eventType: item.eventType,
                  actor: item.actor,
                  timestamp: item.timestamp,
                  location: item.location,
                  notes: item.notes,

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

        setHistory(formattedHistory);
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
    [contract]
  );

  /*
   * Load batches when page opens.
   */
  useEffect(() => {
    loadBatchIds();
  }, [loadBatchIds]);

  /*
   * Load history whenever the selected
   * batch changes.
   */
  useEffect(() => {
    if (selectedBatchId) {
      loadHistory(selectedBatchId);
    }
  }, [selectedBatchId, loadHistory]);

  return (
    <AppShell role={role}>
      <PageHeader
        eyebrow="TRACEABILITY"
        title="Supply-chain history"
        description="A chronological view of recorded product and batch events from the blockchain."
      />

      {/* ERROR */}
      {error && (
        <div
          className="panel"
          style={{ marginBottom: 20 }}
        >
          <p style={{ color: "#dc2626" }}>
            {error}
          </p>
        </div>
      )}

      {/* BATCH SELECTOR */}
      <div
        className="panel"
        style={{ marginBottom: 20 }}
      >
        <div className="panel-header">
          <div>
            <h2>Select batch</h2>

            <p>
              View the immutable history recorded
              for a batch.
            </p>
          </div>

          <select
            value={selectedBatchId}
            onChange={(event) =>
              setSelectedBatchId(
                event.target.value
              )
            }
            disabled={batchIds.length === 0}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              background: "white",
              minWidth: "220px",
            }}
          >
            {batchIds.length === 0 ? (
              <option value="">
                No batches found
              </option>
            ) : (
              batchIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="panel">
          <p>
            Loading blockchain history...
          </p>
        </div>
      ) : !batch ? (
        /* NO BATCH */
        <div className="panel">
          <p>No batch data found.</p>
        </div>
      ) : (
        <div className="history-layout">
          {/* HISTORY TIMELINE */}
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>{batch.batchId}</h2>

                <p>
                  {product?.name ||
                    batch.productId}
                  {" · "}
                  {batch.quantity.toString()} units
                </p>
              </div>

              <span className="status-badge active">
                {STATUS_LABELS[
                  Number(batch.status)
                ] || "UNKNOWN"}
              </span>
            </div>

            {history.length === 0 ? (
              <div
                style={{
                  padding: "20px 0",
                }}
              >
                <p>
                  No history recorded for this
                  batch.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "18px",
                  marginTop: "20px",
                }}
              >
                {history.map(
                  (item, index) => (
                    <div
                      key={item.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "32px 1fr",
                        gap: "14px",
                      }}
                    >
                      {/* TIMELINE NUMBER */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection:
                            "column",
                          alignItems:
                            "center",
                        }}
                      >
                        <span
                          style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            background:
                              "#111827",
                            color: "white",
                            fontSize: "13px",
                            fontWeight: 600,
                          }}
                        >
                          {index + 1}
                        </span>

                        {index <
                          history.length - 1 && (
                          <span
                            style={{
                              width: "2px",
                              flex: 1,
                              marginTop: "6px",
                              background:
                                "#e5e7eb",
                            }}
                          />
                        )}
                      </div>

                      {/* EVENT DETAILS */}
                      <div
                        style={{
                          paddingBottom: "10px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            gap: "12px",
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
                              {item.eventType}
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
                            📍{" "}
                            {item.location}
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
                            {item.notes}
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

          {/* BATCH SUMMARY */}
          <aside className="panel">
            <div className="panel-header">
              <div>
                <h2>Batch summary</h2>

                <p>
                  Current blockchain state
                </p>
              </div>
            </div>

            <div className="journey-summary">
              {/* PRODUCT */}
              <div className="journey-node">
                <span>1</span>

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
                <span>2</span>

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
                <span>3</span>

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
                <span>4</span>

                <div>
                  <strong>
                    {STATUS_LABELS[
                      Number(batch.status)
                    ] || "UNKNOWN"}
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