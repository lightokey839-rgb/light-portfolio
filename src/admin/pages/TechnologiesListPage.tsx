import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminResource } from "../hooks/useAdminResource";
import { deleteTechnology, listTechnologies } from "../../lib/api/technologies";
import type { Technology } from "../../lib/api/types";
import { ApiError } from "../../lib/api/client";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { LoadingBlock, EmptyState, ErrorState } from "../components/AsyncStates";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useToast } from "../components/ToastProvider";
import "../components/AdminTable.css";

export default function TechnologiesListPage() {
  const { showToast } = useToast();
  const { data, status, errorMessage, reload } = useAdminResource(listTechnologies);
  const technologies = data?.technologies ?? [];

  const [deleteTarget, setDeleteTarget] = useState<Technology | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTechnology(deleteTarget.id);
      showToast("success", `"${deleteTarget.name}" was deleted.`);
      setDeleteTarget(null);
      reload();
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Failed to delete technology.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Technologies"
        title="Technologies"
        description="The tech-stack section on the public site."
        action={
          <Link to="/admin/technologies/new" className="btn btn-primary btn-sm">
            New technology
          </Link>
        }
      />

      {status === "loading" && <LoadingBlock label="Loading technologies…" />}

      {status === "error" && (
        <ErrorState message={errorMessage ?? "Unable to load technologies."} onRetry={reload} />
      )}

      {status === "ready" && technologies.length === 0 && (
        <EmptyState title="No technologies yet." hint="Technologies you add will show up here." />
      )}

      {status === "ready" && technologies.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {technologies.map((tech) => (
                <tr key={tech.id}>
                  <td>
                    <Link to={`/admin/technologies/${tech.id}/edit`}>
                      {tech.icon ? `${tech.icon} ` : ""}
                      {tech.name}
                    </Link>
                  </td>
                  <td>
                    <StatusBadge label={tech.category} tone="neutral" />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setDeleteTarget(tech)}
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
        title="Delete this technology?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" will be permanently removed, and unlinked from any projects that reference it. This can't be undone.`
            : undefined
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
