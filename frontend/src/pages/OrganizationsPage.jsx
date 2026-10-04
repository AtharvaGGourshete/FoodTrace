import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import {
  organizations,
} from "../data/mockData";

export default function OrganizationsPage() {
  return (
    <AppShell role="admin">

      <PageHeader
        eyebrow="ADMINISTRATION"
        title="Organizations"
        description="Approve and monitor supply-chain participants."
        action={
          <button className="button button-primary">
            + Register organization
          </button>
        }
      />

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
                  tone={row.status.toLowerCase()}
                >
                  {row.status}
                </StatusBadge>
              ),
            },
          ]}
          rows={organizations}
        />

      </section>

    </AppShell>
  );
}