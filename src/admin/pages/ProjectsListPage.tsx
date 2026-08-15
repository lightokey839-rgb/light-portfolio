import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminResource } from "../hooks/useAdminResource";
import { deleteProject, listProjects } from "../../lib/api/projects";
import type { Project } from "../../lib/api/types";
import { resolveAssetUrl, ApiError } from "../../lib/api/client";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { LoadingBlock, EmptyState, ErrorState } from "../components/AsyncStates";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useToast } from "../components/ToastProvider";
import "../components/AdminTable.css";
import "../components/AdminToolbar.css";

const PAGE_SIZE = 12;

type StatusFilter = "all" | "published" | "draft";
type SortOption = "sortOrder" | "newest" | "oldest" | "title";

export default function ProjectsListPage() {
  const { showToast } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortOption>("sortOrder");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce free-text search so we're not firing a request per keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => setQ(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // Any filter change other than page itself should snap back to page 1.
  useEffect(() => {
    setPage(1);
  }, [q, category, statusFilter, sort]);

  const { data, status, errorMessage, reload } = useAdminResource(
    () => listProjects({ q: q || undefined, category: category || undefined, status: statusFilter, sort, page, pageSize: PAGE_SIZE }),
    [q, category, statusFilter, sort, page]
  );

  const projects = data?.projects ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProject(deleteTarget.id);
      showToast("success", `"${deleteTarget.title}" was deleted.`);
      setDeleteTarget(null);
      reload();
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Failed to delete project.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Projects"
        title="Projects"
        description="Everything shown in the portfolio's work section."
        action={
          <Link to="/admin/projects/new" className="btn btn-primary btn-sm">
            New project
          </Link>
        }
      />

      <div className="admin-toolbar">
        <input
          type="text"
          className="admin-toolbar__input"
          placeholder="Search projects…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <input
          type="text"
          className="admin-toolbar__input"
          style={{ flex: "0 1 160px" }}
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <select
          className="admin-toolbar__select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select
          className="admin-toolbar__select"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
        >
          <option value="sortOrder">Manual order</option>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A–Z</option>
        </select>
      </div>

      {status === "loading" && <LoadingBlock label="Loading projects…" />}

      {status === "error" && (
        <ErrorState message={errorMessage ?? "Unable to load projects."} onRetry={reload} />
      )}

      {status === "ready" && projects.length === 0 && (
        <EmptyState
          title="No projects match these filters."
          hint="Try clearing the search or filters, or create a new project."
        />
      )}

      {status === "ready" && projects.length > 0 && (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      {project.imageUrl ? (
                        <img
                          src={resolveAssetUrl(project.imageUrl) ?? undefined}
                          alt=""
                          className="admin-table__thumb"
                        />
                      ) : (
                        <div className="admin-table__thumb-fallback" aria-hidden="true" />
                      )}
                    </td>
                    <td>
                      <Link to={`/admin/projects/${project.id}/edit`}>{project.title}</Link>
                    </td>
                    <td className="admin-table__muted">{project.category}</td>
                    <td>
                      <StatusBadge
                        label={project.published ? "Published" : "Draft"}
                        tone={project.published ? "positive" : "neutral"}
                      />
                    </td>
                    <td>
                      {project.featured ? (
                        <StatusBadge label="Featured" tone="accent" />
                      ) : (
                        <span className="admin-table__muted">—</span>
                      )}
                    </td>
                    <td className="admin-table__muted">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setDeleteTarget(project)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <span className="admin-pagination__info">
                Page {page} of {totalPages} · {total} total
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this project?"
        description={deleteTarget ? `"${deleteTarget.title}" will be permanently removed. This can't be undone.` : undefined}
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
