import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Building2,
  MapPin,
  Plus,
} from "lucide-react";

import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";

import {
  getReadOnlyContract,
  getSignerContract,
} from "../blockchain/contract";

import { getMetaMaskProvider } from "../blockchain/provider";

const ROLE_LABELS = {
  0: "NONE",
  1: "ADMIN",
  2: "MANUFACTURER",
  3: "DISTRIBUTOR",
  4: "RETAILER",
  5: "CUSTOMER",
};

const ROLE_VALUES = {
  ADMIN: 1,
  MANUFACTURER: 2,
  DISTRIBUTOR: 3,
  RETAILER: 4,
  CUSTOMER: 5,
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

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [form, setForm] = useState({
    organizationId: "",
    name: "",
    walletAddress: "",
    role: "MANUFACTURER",
    location: "",
  });

  const loadOrganizations =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const organizationIds =
          await contract.getOrganizationIds();

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
                  type:
                    ROLE_LABELS[
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

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleRegister(event) {
    event.preventDefault();

    if (
      !form.organizationId.trim() ||
      !form.name.trim() ||
      !form.walletAddress.trim() ||
      !form.location.trim()
    ) {
      setError(
        "Please fill in all organization fields."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const provider =
        await getMetaMaskProvider();

      const signer =
        await provider.getSigner();

      const signerAddress =
        await signer.getAddress();

      const signerContract =
        getSignerContract(signer);

      const roleValue =
        ROLE_VALUES[form.role];

      const tx =
        await signerContract.registerOrganization(
          form.organizationId.trim(),
          form.name.trim(),
          form.walletAddress.trim(),
          roleValue,
          form.location.trim()
        );

      await tx.wait();

      setForm({
        organizationId: "",
        name: "",
        walletAddress: "",
        role: "MANUFACTURER",
        location: "",
      });

      setShowForm(false);

      await loadOrganizations();

      console.log(
        "Organization registered by:",
        signerAddress
      );
    } catch (err) {
      console.error(
        "Organization registration failed:",
        err
      );

      setError(
        err?.shortMessage ||
          err?.reason ||
          err?.message ||
          "Failed to register organization."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell role="admin">
      <PageHeader
        eyebrow="ADMINISTRATION"
        title="Organizations"
        description="View and monitor supply-chain participants registered on the FoodTrace blockchain."
        action={
          <button
            className="button button-primary"
            onClick={() =>
              setShowForm(
                (current) => !current
              )
            }
            disabled={submitting}
          >
            <Plus
              size={17}
              strokeWidth={2}
            />

            {showForm
              ? "Close"
              : "Register organization"}
          </button>
        }
      />

      {showForm && (
        <section
          className="panel"
          style={{
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 20,
            }}
          >
            <Building2
              size={22}
              strokeWidth={2}
            />

            <h2
              style={{
                margin: 0,
              }}
            >
              Register Organization
            </h2>
          </div>

          <form
            onSubmit={handleRegister}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
              }}
            >
              <label>
                <span>Organization ID</span>

                <input
                  name="organizationId"
                  value={
                    form.organizationId
                  }
                  onChange={handleChange}
                  placeholder="ORG-004"
                  required
                />
              </label>

              <label>
                <span>Organization Name</span>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Fresh Foods Ltd"
                  required
                />
              </label>

              <label>
                <span>Wallet Address</span>

                <input
                  name="walletAddress"
                  value={
                    form.walletAddress
                  }
                  onChange={handleChange}
                  placeholder="0x..."
                  required
                />
              </label>

              <label>
                <span>Role</span>

                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                >
                  <option value="MANUFACTURER">
                    Manufacturer
                  </option>

                  <option value="DISTRIBUTOR">
                    Distributor
                  </option>

                  <option value="RETAILER">
                    Retailer
                  </option>

                  <option value="CUSTOMER">
                    Customer
                  </option>
                </select>
              </label>

              <label>
                <span>Location</span>

                <input
                  name="location"
                  value={
                    form.location
                  }
                  onChange={handleChange}
                  placeholder="Mumbai"
                  required
                />
              </label>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent:
                  "flex-end",
                marginTop: 20,
              }}
            >
              <button
                type="submit"
                className="button button-primary"
                disabled={submitting}
              >
                {submitting
                  ? "Registering..."
                  : "Register on blockchain"}
              </button>
            </div>
          </form>
        </section>
      )}

      {error && (
        <section
          className="panel"
          style={{
            marginBottom: 20,
          }}
        >
          <p
            style={{
              color: "#dc2626",
              margin: 0,
            }}
          >
            {error}
          </p>
        </section>
      )}

      {loading ? (
        <section className="panel">
          <p>
            Loading organizations from blockchain...
          </p>
        </section>
      ) : organizations.length === 0 ? (
        <section className="panel">
          <p>
            No organizations have been
            registered on the blockchain yet.
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
                      display: "flex",
                      alignItems:
                        "center",
                      gap: 5,
                    }}
                  >
                    <MapPin
                      size={14}
                      strokeWidth={2}
                    />

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