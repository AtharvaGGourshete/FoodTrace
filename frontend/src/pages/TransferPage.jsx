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

const ROLE_LABELS = {
  0: "NONE",
  1: "ADMIN",
  2: "MANUFACTURER",
  3: "DISTRIBUTOR",
  4: "RETAILER",
  5: "CUSTOMER",
};

function shortenAddress(address) {
  if (!address) {
    return "—";
  }

  return `${address.slice(
    0,
    6
  )}...${address.slice(-4)}`;
}

export default function TransferPage({
  role = "manufacturer",
}) {
  const isRetailer =
    role === "retailer";

  const [contract] = useState(() =>
    getReadOnlyContract()
  );

  const [batchIds, setBatchIds] =
    useState([]);

  const [organizations, setOrganizations] =
    useState([]);

  const [selectedBatchId, setSelectedBatchId] =
    useState("");

  const [batch, setBatch] =
    useState(null);

  const [selectedRecipient, setSelectedRecipient] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [notes, setNotes] =
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
   * Load batches and organizations.
   */
  const loadInitialData =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const [
          ids,
          organizationIds,
        ] = await Promise.all([
          contract.getBatchIds(),
          contract.getOrganizationIds(),
        ]);

        setBatchIds(ids);

        const organizationData =
          await Promise.all(
            organizationIds.map(
              async (organizationId) => {
                const organization =
                  await contract.getOrganization(
                    organizationId
                  );

                return {
                  id:
                    organization.organizationId,
                  name:
                    organization.name,
                  wallet:
                    organization.walletAddress,
                  role: Number(
                    organization.role
                  ),
                  active:
                    organization.active,
                  location:
                    organization.location,
                };
              }
            )
          );

        /*
         * Only active supply-chain
         * organizations should be possible
         * transfer recipients.
         */
        setOrganizations(
          organizationData.filter(
            (item) =>
              item.active &&
              item.role !== 1 &&
              item.role !== 5
          )
        );

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
          "Failed to load transfer data:",
          err
        );

        setError(
          err?.shortMessage ||
            err?.message ||
            "Failed to load transfer data."
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

          /*
           * Don't keep an invalid recipient.
           */
          setSelectedRecipient("");
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
    loadInitialData();
  }, [loadInitialData]);

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

    if (!selectedRecipient) {
      setError(
        "Please select a recipient organization."
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
        "This batch has been recalled and cannot be transferred."
      );
      return;
    }

    try {
      setSubmitting(true);

      /*
       * Ask MetaMask for signer.
       */
      const provider =
        await getMetaMaskProvider();

      const signer =
        await provider.getSigner();

      const signerAddress =
        await signer.getAddress();

      /*
       * Make sure the connected wallet
       * is the current owner.
       */
      if (
        signerAddress.toLowerCase() !==
        batch.currentOwner.toLowerCase()
      ) {
        throw new Error(
          "Connected wallet is not the current owner of this batch."
        );
      }

      /*
       * Connect contract to MetaMask signer.
       */
      const signerContract =
        getSignerContract(
          signer
        );

      /*
       * Submit blockchain transaction.
       */
      const tx =
        await signerContract.transferBatch(
          selectedBatchId,
          selectedRecipient,
          location ||
            "Supply-chain transfer",
          notes ||
            "Batch transferred through FoodTrace"
        );

      setMessage(
        `Transaction submitted: ${tx.hash}`
      );

      /*
       * Wait for confirmation.
       */
      await tx.wait();

      setMessage(
        `Transfer confirmed successfully. Transaction: ${tx.hash}`
      );

      /*
       * Reload batch.
       */
      await loadBatch(
        selectedBatchId
      );

      setNotes("");
      setLocation("");
      setSelectedRecipient("");
    } catch (err) {
      console.error(
        "Transfer failed:",
        err
      );

      setError(
        err?.reason ||
          err?.shortMessage ||
          err?.message ||
          "Transfer transaction failed."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell role={role}>

      <PageHeader
        eyebrow="SUPPLY CHAIN"
        title={
          isRetailer
            ? "Receive batch"
            : "Transfer batch"
        }
        description={
          isRetailer
            ? "Confirm receipt of an incoming batch through the blockchain."
            : "Transfer the current batch ownership to another authorized participant."
        }
      />

      {/* STATUS */}
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
            Loading blockchain data...
          </p>
        </section>
      ) : (
        <div className="form-layout">

          {/* FORM */}
          <section className="panel form-panel">

            <div className="panel-header">

              <div>

                <h2>
                  {isRetailer
                    ? "Receive shipment"
                    : "New ownership transfer"}
                </h2>

                <p>
                  This action will create a
                  real blockchain transaction.
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
                disabled={submitting}
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

              {/* CURRENT OWNER */}
              {batch && (
                <>
                  <label>
                    Current owner
                  </label>

                  <input
                    value={shortenAddress(
                      batch.currentOwner
                    )}
                    readOnly
                  />

                  <label>
                    Batch quantity
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

              {/* RECIPIENT */}
              <label>
                Recipient organization
              </label>

              <select
                value={
                  selectedRecipient
                }
                onChange={(event) =>
                  setSelectedRecipient(
                    event.target.value
                  )
                }
                disabled={
                  submitting
                }
              >

                <option value="">
                  Select recipient
                </option>

                {organizations.map(
                  (organization) => (
                    <option
                      key={
                        organization.id
                      }
                      value={
                        organization.wallet
                      }
                    >
                      {organization.name}
                      {" — "}
                      {
                        ROLE_LABELS[
                          organization.role
                        ]
                      }
                    </option>
                  )
                )}

              </select>

              {/* LOCATION */}
              <label>
                Location
              </label>

              <input
                value={location}
                onChange={(event) =>
                  setLocation(
                    event.target.value
                  )
                }
                placeholder="e.g. Pune"
                disabled={submitting}
              />

              {/* NOTES */}
              <label>
                Notes
              </label>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value
                  )
                }
                placeholder="Optional transfer notes..."
                rows={4}
                disabled={submitting}
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
                    !selectedRecipient ||
                    !batch ||
                    batch.recalled
                  }
                >
                  {submitting
                    ? "Confirming..."
                    : isRetailer
                    ? "Confirm receipt"
                    : "Transfer batch"}
                </button>

              </div>

            </form>

          </section>

          {/* INFO */}
          <aside className="panel info-panel">

            <span className="feature-icon">
              →
            </span>

            <h2>
              Smart-contract rules
            </h2>

            <p>
              FoodTrace enforces ownership and
              authorization directly in Solidity.
            </p>

            <div className="rule-box">

              <code>
                msg.sender == currentOwner
              </code>

              <span>
                Required
              </span>

            </div>

            <div className="rule-box">

              <code>
                newOwner != address(0)
              </code>

              <span>
                Required
              </span>

            </div>

            <div className="rule-box">

              <code>
                newOwner is authorized
              </code>

              <span>
                Required
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

          </aside>

        </div>
      )}

    </AppShell>
  );
}