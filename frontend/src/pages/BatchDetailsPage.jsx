import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import Timeline from "../components/Timeline";

import { getReadOnlyContract } from "../blockchain/contract";

const BATCH_STATUS = {
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
  if (!timestamp) return "—";

  return new Date(
    Number(timestamp) * 1000
  ).toLocaleDateString();
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "—";

  return new Date(
    Number(timestamp) * 1000
  ).toLocaleString();
}

function shortenAddress(address) {
  if (!address) return "—";

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function BatchDetailsPage({
  role = "manufacturer",
}) {
  const { id } = useParams();

  const [batch, setBatch] = useState(null);
  const [product, setProduct] = useState(null);
  const [owner, setOwner] = useState(null);
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadBatch() {
      try {
        setLoading(true);
        setError("");

        const contract = getReadOnlyContract();

        /*
         * Load batch directly from Solidity.
         */
        const batchData =
          await contract.getBatch(id);

        /*
         * Load associated product.
         */
        let productData = null;

        try {
          productData =
            await contract.getProduct(
              batchData.productId
            );
        } catch (productError) {
          console.warn(
            "Could not load product:",
            productError
          );
        }

        /*
         * Load current owner organization.
         */
        let ownerData = null;

        try {
          const organizationId =
            await contract.organizationIdByAddress(
              batchData.currentOwner
            );

          if (organizationId) {
            ownerData =
              await contract.getOrganization(
                organizationId
              );
          }
        } catch (ownerError) {
          console.warn(
            "Could not load owner organization:",
            ownerError
          );
        }

        /*
         * Load immutable batch history.
         */
        const historyData =
          await contract.getBatchHistory(id);

        const formattedHistory =
          historyData.map((event, index) => ({
            id: index,

            title:
              event.eventType,

            description:
              event.notes ||
              "Blockchain event recorded.",

            location:
              event.location ||
              "—",

            actor:
              shortenAddress(
                event.actor
              ),

            timestamp:
              formatTimestamp(
                event.timestamp
              ),
          }));

        if (cancelled) return;

        setBatch({
          id: batchData.batchId,

          productId:
            batchData.productId,

          quantity:
            Number(batchData.quantity),

          manufacturingDate:
            formatDate(
              batchData.manufacturingDate
            ),

          expiryDate:
            formatDate(
              batchData.expiryDate
            ),

          mrp:
            Number(batchData.mrp),

          currentOwner:
            batchData.currentOwner,

          owner:
            ownerData?.name ||
            shortenAddress(
              batchData.currentOwner
            ),

          ownerRole:
            ownerData
              ? ROLE_NAMES[
                  Number(ownerData.role)
                ] || "UNKNOWN"
              : "UNKNOWN",

          status:
            BATCH_STATUS[
              Number(batchData.status)
            ] || "UNKNOWN",

          recalled:
            batchData.recalled,

          recallReason:
            batchData.recallReason,

          createdAt:
            formatTimestamp(
              batchData.createdAt
            ),
        });

        setProduct(productData);
        setOwner(ownerData);
        setHistory(formattedHistory);

      } catch (err) {
        console.error(
          "Failed to load batch:",
          err
        );

        if (!cancelled) {
          setError(
            err?.shortMessage ||
              err?.message ||
              "Failed to load batch from blockchain."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadBatch();
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <AppShell role={role}>
        <PageHeader
          eyebrow="BATCH DETAILS"
          title="Loading batch..."
          description="Reading batch information from the FoodTrace blockchain."
          action={
            <Link
              className="button button-secondary"
              to="/app/batches"
            >
              ← Back to batches
            </Link>
          }
        />

        <section className="panel">
          <p className="muted">
            Loading blockchain data...
          </p>
        </section>
      </AppShell>
    );
  }

  if (error || !batch) {
    return (
      <AppShell role={role}>
        <PageHeader
          eyebrow="BATCH DETAILS"
          title="Batch unavailable"
          description="The requested batch could not be loaded from the FoodTrace blockchain."
          action={
            <Link
              className="button button-secondary"
              to="/app/batches"
            >
              ← Back to batches
            </Link>
          }
        />

        <section className="panel">
          <p className="muted">
            {error || "Batch not found."}
          </p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell role={role}>

      <PageHeader
        eyebrow="BATCH DETAILS"
        title={batch.id}
        description={`${product?.name || batch.productId} · ${batch.quantity.toLocaleString()} units`}
        action={
          <Link
            className="button button-secondary"
            to="/app/batches"
          >
            ← Back to batches
          </Link>
        }
      />

      {batch.recalled && (
        <div className="alert alert-danger">

          <span>
            ⚠
          </span>

          <div>

            <strong>
              This batch has been recalled.
            </strong>

            <p>
              {batch.recallReason ||
                "Further transfers should be blocked by the smart contract."}
            </p>

          </div>

        </div>
      )}

      <div className="detail-grid four">

        {[
          [
            "Product",
            product?.name ||
              batch.productId,
          ],

          [
            "Quantity",
            batch.quantity.toLocaleString(),
          ],

          [
            "MRP",
            `₹${batch.mrp.toLocaleString()}`,
          ],

          [
            "Current owner",
            batch.owner,
          ],
        ].map(
          ([label, value]) => (
            <div
              className="detail-stat"
              key={label}
            >

              <span>
                {label}
              </span>

              <strong>
                {value}
              </strong>

            </div>
          )
        )}

      </div>

      <div className="two-column">

        <section className="panel">

          <div className="panel-header">

            <div>

              <h2>
                Batch information
              </h2>

              <p>
                Recorded batch metadata
              </p>

            </div>

          </div>

          <div className="detail-info vertical">

            <div>
              <span>
                Batch ID
              </span>

              <strong>
                {batch.id}
              </strong>
            </div>

            <div>
              <span>
                Product ID
              </span>

              <strong>
                {batch.productId}
              </strong>
            </div>

            <div>
              <span>
                Manufacturing date
              </span>

              <strong>
                {batch.manufacturingDate}
              </strong>
            </div>

            <div>
              <span>
                Expiry date
              </span>

              <strong>
                {batch.expiryDate}
              </strong>
            </div>

            <div>
              <span>
                Owner role
              </span>

              <strong>
                {batch.ownerRole}
              </strong>
            </div>

            <div>
              <span>
                Owner wallet
              </span>

              <strong>
                {shortenAddress(
                  batch.currentOwner
                )}
              </strong>
            </div>

            <div>
              <span>
                Status
              </span>

              <StatusBadge>
                {batch.status}
              </StatusBadge>
            </div>

            <div>
              <span>
                Created
              </span>

              <strong>
                {batch.createdAt}
              </strong>
            </div>

          </div>

        </section>

        <section className="panel">

          <div className="panel-header">

            <div>

              <h2>
                Supply-chain journey
              </h2>

              <p>
                Recorded blockchain events
              </p>

            </div>

          </div>

          {history.length > 0 ? (
            <Timeline
              items={history}
            />
          ) : (
            <p className="muted">
              No history events recorded.
            </p>
          )}

        </section>

      </div>

      <section className="panel">

        <div className="panel-header">

          <div>

            <h2>
              Blockchain reference
            </h2>

            <p>
              Live contract information
            </p>

          </div>

        </div>

        <div className="hash-grid">

          <div>
            <span>
              Batch ID
            </span>

            <code>
              {batch.id}
            </code>
          </div>

          <div>
            <span>
              Current owner wallet
            </span>

            <code>
              {batch.currentOwner}
            </code>
          </div>

          <div>
            <span>
              Contract
            </span>

            <code>
              {import.meta.env.VITE_FOODTRACE_CONTRACT_ADDRESS ||
                "Configured in blockchain/config.js"}
            </code>
          </div>

          <div>
            <span>
              Network
            </span>

            <strong>
              FoodTrace Local · 1337
            </strong>
          </div>

        </div>

      </section>

    </AppShell>
  );
}