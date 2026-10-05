import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { Link, useParams } from "react-router-dom";

import StatusBadge from "../components/StatusBadge";

import {
  getReadOnlyContract,
} from "../blockchain/contract";

const STATUS_LABELS = {
  0: "ACTIVE",
  1: "SOLD",
  2: "RECALLED",
  3: "IN TRANSIT",
  4: "DELIVERED",
};

const ROLE_LABELS = {
  0: "NONE",
  1: "ADMIN",
  2: "MANUFACTURER",
  3: "DISTRIBUTOR",
  4: "RETAILER",
  5: "CUSTOMER",
};

function formatDate(timestamp) {
  if (!timestamp) {
    return "—";
  }

  return new Date(
    Number(timestamp) * 1000
  ).toLocaleDateString();
}

function formatDateTime(timestamp) {
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

function formatMRP(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return "—";
  }

  return `₹${Number(
    value
  ).toLocaleString()}`;
}

export default function VerifyPage() {
  const { batchId: routeBatchId } =
    useParams();

  const [contract] = useState(() =>
    getReadOnlyContract()
  );

  const [batchIds, setBatchIds] =
    useState([]);

  const [batchInput, setBatchInput] =
    useState(routeBatchId || "");

  const [selectedBatchId, setSelectedBatchId] =
    useState(routeBatchId || "");

  const [batch, setBatch] =
    useState(null);

  const [product, setProduct] =
    useState(null);

  const [manufacturer, setManufacturer] =
    useState(null);

  const [history, setHistory] =
    useState([]);

  const [verification, setVerification] =
    useState(null);

  const [loadingBatches, setLoadingBatches] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * Load every batch ID from blockchain.
   */
  const loadBatchIds =
    useCallback(async () => {
      try {
        setLoadingBatches(true);

        const ids =
          await contract.getBatchIds();

        setBatchIds(ids);

        /*
         * If URL contains a valid batch,
         * keep it.
         */
        if (
          routeBatchId &&
          ids.includes(routeBatchId)
        ) {
          setSelectedBatchId(
            routeBatchId
          );

          setBatchInput(
            routeBatchId
          );
        } else if (
          !routeBatchId &&
          ids.length > 0
        ) {
          /*
           * Otherwise don't automatically
           * verify anything. User can select
           * or type a batch.
           */
          setSelectedBatchId("");
          setBatchInput("");
        }
      } catch (err) {
        console.error(
          "Failed to load batch IDs:",
          err
        );

        setError(
          err?.shortMessage ||
            err?.message ||
            "Failed to load available batches."
        );
      } finally {
        setLoadingBatches(false);
      }
    }, [
      contract,
      routeBatchId,
    ]);

  /*
   * Verify a specific batch.
   */
  const verifyBatch =
    useCallback(
      async (batchId) => {
        const cleanBatchId =
          batchId?.trim();

        if (!cleanBatchId) {
          setError(
            "Please enter or select a batch ID."
          );
          return;
        }

        try {
          setLoading(true);
          setError("");

          /*
           * First verify that the batch exists.
           */
          const [
            batchData,
            verificationData,
          ] = await Promise.all([
            contract.getBatch(
              cleanBatchId
            ),

            contract.verifyBatch(
              cleanBatchId
            ),
          ]);

          /*
           * Product and history.
           */
          const [
            productData,
            historyData,
          ] = await Promise.all([
            contract.getProduct(
              batchData.productId
            ),

            contract.getBatchHistory(
              cleanBatchId
            ),
          ]);

          /*
           * Resolve manufacturer.
           */
          let manufacturerData =
            null;

          try {
            const organizationId =
              await contract.organizationIdByAddress(
                productData.manufacturer
              );

            if (organizationId) {
              manufacturerData =
                await contract.getOrganization(
                  organizationId
                );
            }
          } catch (err) {
            console.warn(
              "Could not resolve manufacturer:",
              err
            );
          }

          /*
           * Resolve history actors.
           */
          const formattedHistory =
            await Promise.all(
              historyData.map(
                async (
                  event,
                  index
                ) => {
                  let actorOrganization =
                    null;

                  try {
                    const organizationId =
                      await contract.organizationIdByAddress(
                        event.actor
                      );

                    if (
                      organizationId
                    ) {
                      actorOrganization =
                        await contract.getOrganization(
                          organizationId
                        );
                    }
                  } catch (err) {
                    console.warn(
                      "Could not resolve actor organization:",
                      err
                    );
                  }

                  return {
                    id: index,
                    eventType:
                      event.eventType,
                    actor:
                      event.actor,
                    timestamp:
                      event.timestamp,
                    location:
                      event.location,
                    notes:
                      event.notes,
                    organization:
                      actorOrganization?.name ||
                      null,
                    role:
                      actorOrganization
                        ? Number(
                            actorOrganization.role
                          )
                        : null,
                  };
                }
              )
            );

          setBatch(
            batchData
          );

          setProduct(
            productData
          );

          setManufacturer(
            manufacturerData
          );

          setHistory(
            formattedHistory
          );

          setVerification({
            valid:
              verificationData.valid,

            recalled:
              verificationData.recalled,

            currentOwner:
              verificationData.currentOwner,

            status:
              Number(
                verificationData.status
              ),
          });

          setSelectedBatchId(
            cleanBatchId
          );

          setBatchInput(
            cleanBatchId
          );
        } catch (err) {
          console.error(
            "Batch verification failed:",
            err
          );

          setBatch(null);
          setProduct(null);
          setManufacturer(null);
          setHistory([]);
          setVerification(null);

          setError(
            err?.shortMessage ||
              err?.reason ||
              "Batch not found or verification failed."
          );
        } finally {
          setLoading(false);
        }
      },
      [contract]
    );

  /*
   * Initial batch list.
   */
  useEffect(() => {
    loadBatchIds();
  }, [loadBatchIds]);

  /*
   * If URL contains a batch ID,
   * automatically verify it.
   */
  useEffect(() => {
    if (
      routeBatchId &&
      batchIds.includes(routeBatchId)
    ) {
      verifyBatch(routeBatchId);
    }
  }, [
    routeBatchId,
    batchIds,
    verifyBatch,
  ]);

  function handleDropdownChange(
    event
  ) {
    const value =
      event.target.value;

    setBatchInput(value);

    if (value) {
      verifyBatch(value);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    verifyBatch(batchInput);
  }

  const status =
    verification?.status ??
    (batch
      ? Number(batch.status)
      : null);

  const statusLabel =
    STATUS_LABELS[status] ||
    "UNKNOWN";

  const isRecalled =
    Boolean(
      verification?.recalled ||
      batch?.recalled ||
      status === 2
    );

  return (
    <div className="verify-page">

      {/* HEADER */}
      <header className="verify-header">

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

        <span className="verified-network">
          ⌁ Blockchain verification
        </span>

      </header>

      <main className="verify-main">

        {/* INTRO */}
        <div className="verify-intro">

          <div className="verified-icon">
            {loading
              ? "…"
              : isRecalled
              ? "!"
              : "✓"}
          </div>

          <div className="eyebrow">
            PUBLIC VERIFICATION
          </div>

          <h1>
            Verify any food batch
          </h1>

          <p>
            Enter a batch ID or select a
            batch to verify its authenticity
            and supply-chain history directly
            from the blockchain.
          </p>

        </div>

        {/* BATCH SEARCH */}
        <section
          className="verification-card"
          style={{
            marginBottom: 20,
          }}
        >

          <div className="panel-header">

            <div>
              <h2>
                Verify batch
              </h2>

              <p>
                Search the FoodTrace blockchain.
              </p>
            </div>

          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 16,
            }}
          >

            <input
              value={batchInput}
              onChange={(event) =>
                setBatchInput(
                  event.target.value
                )
              }
              placeholder="Enter batch ID e.g. BATCH-2026-001"
              style={{
                flex: 1,
                minWidth: 250,
              }}
            />

            <button
              type="submit"
              className="button button-primary"
              disabled={loading}
            >
              {loading
                ? "Verifying..."
                : "Verify Batch"}
            </button>

          </form>

          <div
            style={{
              marginTop: 14,
            }}
          >

            <label>
              Or select an existing batch
            </label>

            <select
              value={selectedBatchId}
              onChange={
                handleDropdownChange
              }
              disabled={
                loadingBatches
              }
              style={{
                width: "100%",
                marginTop: 6,
              }}
            >

              <option value="">
                Select a batch
              </option>

              {batchIds.map(
                (id) => (
                  <option
                    key={id}
                    value={id}
                  >
                    {id}
                  </option>
                )
              )}

            </select>

          </div>

        </section>

        {/* ERROR */}
        {error && (
          <section className="verification-card">

            <div className="alert alert-danger">

              <span>
                ⚠
              </span>

              <div>
                <strong>
                  Verification failed
                </strong>

                <p>
                  {error}
                </p>
              </div>

            </div>

          </section>
        )}

        {/* LOADING */}
        {loading && (
          <section className="verification-card">

            <p>
              Reading batch information
              from the blockchain...
            </p>

          </section>
        )}

        {/* RESULT */}
        {!loading &&
          !error &&
          batch && (
            <>

              {/* BATCH INFORMATION */}
              <section
                className={`verification-card ${
                  isRecalled
                    ? "recalled"
                    : ""
                }`}
              >

                <div className="verification-head">

                  <div className="product-art large">
                    🥫
                  </div>

                  <div>

                    <span className="eyebrow">
                      PRODUCT
                    </span>

                    <h2>
                      {product?.name ||
                        batch.productId}
                    </h2>

                    <p>
                      {batch.batchId}
                    </p>

                  </div>

                  <StatusBadge>
                    {statusLabel}
                  </StatusBadge>

                </div>

                {/* VERIFICATION RESULT */}
                <div
                  style={{
                    marginBottom: 20,
                    padding:
                      "14px 16px",
                    borderRadius: 10,
                    background:
                      isRecalled
                        ? "#fef2f2"
                        : "#f0fdf4",
                  }}
                >

                  <strong>
                    {verification?.valid
                      ? "✓ Batch verified on blockchain"
                      : "⚠ Batch verification failed"}
                  </strong>

                  <p
                    style={{
                      margin:
                        "6px 0 0",
                    }}
                  >
                    Current owner:{" "}
                    {shortenAddress(
                      verification?.currentOwner
                    )}
                  </p>

                </div>

                {/* RECALL WARNING */}
                {isRecalled && (
                  <div className="alert alert-danger">

                    <span>
                      ⚠
                    </span>

                    <div>

                      <strong>
                        RECALLED
                      </strong>

                      <p>
                        This batch has been
                        recalled. Do not consume
                        or sell this product.
                      </p>

                      {batch.recallReason && (
                        <p>
                          Reason:{" "}
                          {
                            batch.recallReason
                          }
                        </p>
                      )}

                    </div>

                  </div>
                )}

                {/* DETAILS */}
                <div className="verify-details">

                  <div>
                    <span>
                      Manufacturer
                    </span>

                    <strong>
                      {manufacturer?.name ||
                        shortenAddress(
                          product?.manufacturer
                        )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Manufacturing date
                    </span>

                    <strong>
                      {formatDate(
                        batch.manufacturingDate
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Expiry date
                    </span>

                    <strong>
                      {formatDate(
                        batch.expiryDate
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Quantity
                    </span>

                    <strong>
                      {Number(
                        batch.quantity
                      ).toLocaleString()}{" "}
                      units
                    </strong>
                  </div>

                  <div>
                    <span>
                      MRP
                    </span>

                    <strong>
                      {formatMRP(
                        batch.mrp
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Created
                    </span>

                    <strong>
                      {formatDate(
                        batch.createdAt
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Current status
                    </span>

                    <StatusBadge>
                      {statusLabel}
                    </StatusBadge>
                  </div>

                  <div>
                    <span>
                      Current owner
                    </span>

                    <strong>
                      {shortenAddress(
                        verification?.currentOwner
                      )}
                    </strong>
                  </div>

                </div>

              </section>

              {/* HISTORY */}
              <section className="verification-card">

                <div className="panel-header">

                  <div>

                    <h2>
                      Supply-chain journey
                    </h2>

                    <p>
                      Every recorded event
                      comes from the blockchain.
                    </p>

                  </div>

                </div>

                {history.length ===
                0 ? (
                  <p>
                    No history recorded
                    for this batch.
                  </p>
                ) : (
                  <div
                    style={{
                      display:
                        "flex",
                      flexDirection:
                        "column",
                      gap: 18,
                      marginTop: 20,
                    }}
                  >

                    {history.map(
                      (
                        event,
                        index
                      ) => (
                        <div
                          key={
                            event.id
                          }
                          style={{
                            display:
                              "grid",
                            gridTemplateColumns:
                              "34px 1fr",
                            gap: 14,
                          }}
                        >

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

                            <div
                              style={{
                                width: 32,
                                height: 32,
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
                                  13,
                                fontWeight:
                                  600,
                              }}
                            >
                              {index + 1}
                            </div>

                            {index <
                              history.length -
                                1 && (
                              <div
                                style={{
                                  width: 2,
                                  flex: 1,
                                  marginTop:
                                    5,
                                  background:
                                    "#e5e7eb",
                                }}
                              />
                            )}

                          </div>

                          <div
                            style={{
                              paddingBottom:
                                10,
                            }}
                          >

                            <div
                              style={{
                                display:
                                  "flex",
                                justifyContent:
                                  "space-between",
                                gap: 12,
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
                                    event.eventType
                                  }
                                </h3>

                                {event.organization && (
                                  <p
                                    style={{
                                      margin:
                                        "5px 0 0",
                                      fontWeight:
                                        600,
                                    }}
                                  >
                                    {
                                      event.organization
                                    }
                                  </p>
                                )}

                              </div>

                              <span
                                style={{
                                  fontSize:
                                    13,
                                  color:
                                    "#6b7280",
                                }}
                              >
                                {formatDateTime(
                                  event.timestamp
                                )}
                              </span>

                            </div>

                            {event.location && (
                              <p
                                style={{
                                  margin:
                                    "8px 0 0",
                                  color:
                                    "#4b5563",
                                }}
                              >
                                📍{" "}
                                {
                                  event.location
                                }
                              </p>
                            )}

                            {event.notes && (
                              <p
                                style={{
                                  margin:
                                    "6px 0 0",
                                  color:
                                    "#4b5563",
                                }}
                              >
                                {
                                  event.notes
                                }
                              </p>
                            )}

                            <p
                              style={{
                                margin:
                                  "8px 0 0",
                                fontSize:
                                  12,
                                color:
                                  "#9ca3af",
                              }}
                            >
                              {event.role !==
                                null &&
                                ROLE_LABELS[
                                  event.role
                                ]}{" "}
                              · Actor:{" "}
                              {shortenAddress(
                                event.actor
                              )}
                            </p>

                          </div>

                        </div>
                      )
                    )}

                  </div>
                )}

              </section>

              <div className="verification-foot">

                <span>
                  FoodTrace · Live blockchain
                  verification
                </span>

                <Link to="/">
                  Powered by FoodTrace →
                </Link>

              </div>

            </>
          )}

      </main>
    </div>
  );
}