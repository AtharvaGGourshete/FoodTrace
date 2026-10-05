import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";

import {
  getReadOnlyContract,
  getSignerContract,
} from "../blockchain/contract";

import {
  getMetaMaskProvider,
} from "../blockchain/provider";

export default function RecallPage({
  role = "manufacturer",
}) {
  const [contract] = useState(() =>
    getReadOnlyContract()
  );

  const [batchIds, setBatchIds] =
    useState([]);

  const [selectedBatchId, setSelectedBatchId] =
    useState("");

  const [batch, setBatch] =
    useState(null);

  const [reason, setReason] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  /*
   * Load all batches.
   */
  const loadBatchIds =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const ids =
          await contract.getBatchIds();

        setBatchIds(ids);

        if (
          ids.length > 0 &&
          !selectedBatchId
        ) {
          setSelectedBatchId(
            ids[0]
          );
        }
      } catch (err) {
        console.error(
          "Failed to load batches:",
          err
        );

        setError(
          err?.shortMessage ||
            err?.message ||
            "Failed to load batches."
        );
      } finally {
        setLoading(false);
      }
    }, [
      contract,
      selectedBatchId,
    ]);

  /*
   * Load selected batch.
   */
  const loadBatch =
    useCallback(
      async (batchId) => {
        if (!batchId) {
          setBatch(null);
          return;
        }

        try {
          setError("");

          const batchData =
            await contract.getBatch(
              batchId
            );

          setBatch(batchData);
        } catch (err) {
          console.error(
            "Failed to load batch:",
            err
          );

          setBatch(null);

          setError(
            err?.shortMessage ||
              err?.message ||
              "Failed to load batch."
          );
        }
      },
      [contract]
    );

  useEffect(() => {
    loadBatchIds();
  }, [loadBatchIds]);

  useEffect(() => {
    loadBatch(
      selectedBatchId
    );
  }, [
    selectedBatchId,
    loadBatch,
  ]);

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!selectedBatchId) {
      setError(
        "Please select a batch."
      );
      return;
    }

    if (!reason.trim()) {
      setError(
        "Please enter a recall reason."
      );
      return;
    }

    if (!batch) {
      setError(
        "Batch information is not loaded."
      );
      return;
    }

    if (batch.recalled) {
      setError(
        "This batch has already been recalled."
      );
      return;
    }

    try {
      setSubmitting(true);

      /*
       * Connect MetaMask.
       */
      const provider =
        await getMetaMaskProvider();

      const signer =
        await provider.getSigner();

      /*
       * Connect contract to signer.
       */
      const signerContract =
        getSignerContract(
          signer
        );

      /*
       * Submit recall transaction.
       */
      const tx =
        await signerContract.recallBatch(
          selectedBatchId,
          reason.trim(),
          location ||
            "Recall location"
        );

      setMessage(
        `Recall transaction submitted: ${tx.hash}`
      );

      /*
       * Wait for blockchain confirmation.
       */
      await tx.wait();

      setMessage(
        `Batch ${selectedBatchId} has been successfully recalled. Transaction: ${tx.hash}`
      );

      /*
       * Reload blockchain state.
       */
      await loadBatch(
        selectedBatchId
      );

      setReason("");
      setLocation("");
    } catch (err) {
      console.error(
        "Recall failed:",
        err
      );

      setError(
        err?.reason ||
          err?.shortMessage ||
          err?.message ||
          "Recall transaction failed."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell role={role}>

      <PageHeader
        eyebrow="QUALITY & SAFETY"
        title="Recall batch"
        description="Mark a food batch as recalled directly on the FoodTrace blockchain."
      />

      {/* SUCCESS */}
      {message && (
        <div
          className="panel"
          style={{
            marginBottom: 20,
          }}
        >
          <p>
            ✓ {message}
          </p>
        </div>
      )}

      {/* ERROR */}
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

      {loading ? (
        <section className="panel">
          <p>
            Loading blockchain batches...
          </p>
        </section>
      ) : (
        <div className="form-layout">

          {/* FORM */}
          <section className="panel form-panel">

            <div className="panel-header">

              <div>

                <h2>
                  Create recall
                </h2>

                <p>
                  This action permanently records
                  the recall state on-chain.
                </p>

              </div>

            </div>

            <form
              onSubmit={handleSubmit}
            >

              {/* BATCH */}
              <label>
                Batch
              </label>

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
                  submitting
                }
              >

                <option value="">
                  Select batch
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

              {/* BATCH INFO */}
              {batch && (
                <>
                  <label>
                    Current owner
                  </label>

                  <input
                    value={
                      batch.currentOwner
                    }
                    readOnly
                  />

                  <label>
                    Quantity
                  </label>

                  <input
                    value={`${Number(
                      batch.quantity
                    ).toLocaleString()} units`}
                    readOnly
                  />

                  <label>
                    Current status
                  </label>

                  <input
                    value={
                      batch.recalled
                        ? "RECALLED"
                        : Number(
                            batch.status
                          ) === 0
                        ? "ACTIVE"
                        : "IN PROGRESS"
                    }
                    readOnly
                  />
                </>
              )}

              {/* REASON */}
              <label>
                Recall reason
              </label>

              <textarea
                value={reason}
                onChange={(event) =>
                  setReason(
                    event.target.value
                  )
                }
                placeholder="Explain why this batch is being recalled..."
                rows={5}
                disabled={
                  submitting
                }
              />

              {/* LOCATION */}
              <label>
                Recall location
              </label>

              <input
                value={location}
                onChange={(event) =>
                  setLocation(
                    event.target.value
                  )
                }
                placeholder="e.g. Mumbai"
                disabled={
                  submitting
                }
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
                  disabled={
                    submitting ||
                    !selectedBatchId ||
                    !reason.trim() ||
                    !batch ||
                    batch.recalled
                  }
                >
                  {submitting
                    ? "Confirming..."
                    : "Recall batch"}
                </button>

              </div>

            </form>

          </section>

          {/* WARNING / RULES */}
          <aside className="panel info-panel">

            <span className="feature-icon">
              ⚠
            </span>

            <h2>
              Recall rules
            </h2>

            <p>
              A recall is recorded directly on
              the blockchain and becomes part of
              the batch history.
            </p>

            <div className="rule-box">

              <code>
                authorized caller
              </code>

              <span>
                Admin / Manufacturer
              </span>

            </div>

            <div className="rule-box">

              <code>
                batch.recalled == false
              </code>

              <span>
                Required
              </span>

            </div>

            <div className="rule-box">

              <code>
                reason.length &gt; 0
              </code>

              <span>
                Required
              </span>

            </div>

          </aside>

        </div>
      )}

    </AppShell>
  );
}