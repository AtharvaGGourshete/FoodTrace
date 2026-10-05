import {
  useCallback,
  useEffect,
  useState,
} from "react";

import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";

import { getReadOnlyContract } from "../blockchain/contract";

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

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function OrganizationsPage() {
  const [contract] = useState(() =>
    getReadOnlyContract()
  );

  const [organizations, setOrganizations] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrganizations =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        /*
         * Get all registered organization IDs
         * directly from the smart contract.
         */
        const organizationIds =
          await contract.getOrganizationIds();

        /*
         * Load organization details and batch
         * counts.
         */
        const organizationData =
          await Promise.all(
            organizationIds.map(
              async (organizationId) => {
                const organization =
                  await contract.getOrganization(
                    organizationId
                  );

                let batchCount = 0;

                try {
                  batchCount = Number(
                    await contract.getOrganizationBatchCount(
                      organization.walletAddress
                    )
                  );
                } catch (batchError) {
                  console.warn(
                    `Could not load batch count for ${organizationId}:`,
                    batchError
                  );
                }

                return {
                  id: organization.organizationId,
                  name: organization.name,
                  type: ROLE_LABELS[
                    Number(organization.role)
                  ] || "UNKNOWN",
                  wallet:
                    organization.walletAddress,
                  batches: batchCount,
                  status: organization.active
                    ? "ACTIVE"
                    : "INACTIVE",
                  location:
                    organization.location,
                };
              }
            )
          );

        setOrganizations(
          organizationData
        );
      } catch (err) {
        console.error(
          "Failed to load organizations:",
          err
        );

        setOrganizations([]);

        setError(
          err?.shortMessage ||
            err?.message ||
            "Failed to load organizations."
        );
      } finally {
        setLoading(false);
      }
    }, [contract]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  return (
    <AppShell role="admin">
      <PageHeader
        eyebrow="ADMINISTRATION"
        title="Organizations"
        description="View and monitor supply-chain participants registered on the FoodTrace blockchain."
        action={
          <button
            className="button button-primary"
            disabled
            title="Organization registration will be connected to the smart contract next."
          >
            + Register organization
          </button>
        }
      />

      {/* ERROR */}
      {error && (
        <section
          className="panel"
          style={{ marginBottom: 20 }}
        >
          <p style={{ color: "#dc2626" }}>
            {error}
          </p>
        </section>
      )}

      {/* LOADING */}
      {loading ? (
        <section className="panel">
          <p>
            Loading organizations from blockchain...
          </p>
        </section>
      ) : organizations.length === 0 ? (
        /* EMPTY */
        <section className="panel">
          <p>
            No organizations have been registered
            on the blockchain yet.
          </p>
        </section>
      ) : (
        <section className="panel">
          <DataTable
            columns={[
              {
                key: "id",
                label: "Organization ID",
              },

              {
                key: "name",
                label: "Organization",
              },

              {
                key: "type",
                label: "Role",
              },

              {
                key: "wallet",
                label: "Wallet",
                render: (row) => (
                  <code>
                    {shortenAddress(
                      row.wallet
                    )}
                  </code>
                ),
              },

              {
                key: "batches",
                label: "Batches",
              },

              {
                key: "status",
                label: "Status",
                render: (row) => (
                  <StatusBadge
                    tone={
                      row.status === "ACTIVE"
                        ? "active"
                        : "inactive"
                    }
                  >
                    {row.status}
                  </StatusBadge>
                ),
              },
            ]}
            rows={organizations}
          />

          {/* ORGANIZATION LOCATION DETAILS */}
          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop:
                "1px solid #e5e7eb",
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {organizations.map(
              (organization) => (
                <div
                  key={organization.id}
                  style={{
                    padding: 14,
                    border:
                      "1px solid #e5e7eb",
                    borderRadius: 8,
                  }}
                >
                  <strong>
                    {organization.name}
                  </strong>

                  <p
                    style={{
                      margin:
                        "5px 0 0",
                      color:
                        "#6b7280",
                      fontSize: 13,
                    }}
                  >
                    📍{" "}
                    {organization.location ||
                      "Location not specified"}
                  </p>
                </div>
              )
            )}
          </div>
        </section>
      )}
    </AppShell>
  );
}