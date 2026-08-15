import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminResource } from "../hooks/useAdminResource";
import { deleteService, listServices } from "../../lib/api/services";
import type { Service } from "../../lib/api/types";
import { ApiError } from "../../lib/api/client";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { LoadingBlock, EmptyState, ErrorState } from "../components/AsyncStates";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useToast } from "../components/ToastProvider";
import "../components/AdminTable.css";

export default function ServicesListPage() {
  const { showToast } = useToast();
  const { data, status, errorMessage, reload } = useAdminResource(listServices);
  const services = data?.services ?? [];

  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteService(deleteTarget.id);
      showToast("success", `"${deleteTarget.title}" was deleted.`);
      setDeleteTarget(null);
      reload();
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Failed to delete service.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Services"
        title="Services"
        description="What's offered on the portfolio's services section."
        action={
          <Link to="/admin/services/new" className="btn btn-primary btn-sm">
            New service
          </Link>
        }
      />

      {status === "loading" && <LoadingBlock label="Loading services…" />}

      {status === "error" && (
        <ErrorState message={errorMessage ?? "Unable to load services."} onRetry={reload} />
      )}

      {status === "ready" && services.length === 0 && (
        <EmptyState title="No services yet." hint="Services you add will show up here." />
      )}

      {status === "ready" && services.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Sort</th>
                <th>Featured</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td>
                    <Link to={`/admin/services/${service.id}/edit`}>
                      {service.icon ? `${service.icon} ` : ""}
                      {service.title}
                    </Link>
                  </td>
                  <td className="admin-table__muted">{service.description}</td>
                  <td className="admin-table__muted">{service.sortOrder}</td>
                  <td>
                    {service.featured ? (
                      <StatusBadge label="Featured" tone="accent" />
                    ) : (
                      <span className="admin-table__muted">—</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setDeleteTarget(service)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this service?"
        description={
          deleteTarget ? `"${deleteTarget.title}" will be permanently removed. This can't be undone.` : undefined
        }
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
