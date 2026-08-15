import { Fragment, useState } from "react";
import { useAdminResource } from "../hooks/useAdminResource";
import { deleteMessage, listMessages, updateMessage } from "../../lib/api/messages";
import type { Message } from "../../lib/api/types";
import { ApiError } from "../../lib/api/client";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { LoadingBlock, EmptyState, ErrorState } from "../components/AsyncStates";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useToast } from "../components/ToastProvider";
import "../components/AdminTable.css";
import "../components/AdminToolbar.css";

type StatusFilter = "all" | "unread" | "read";
type SortOption = "newest" | "oldest";

export default function MessagesListPage() {
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data, status, errorMessage, reload } = useAdminResource(
    () => listMessages({ status: statusFilter, sort }),
    [statusFilter, sort]
  );

  const messages = data?.messages ?? [];

  const toggleExpanded = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const handleToggleRead = async (message: Message) => {
    setUpdatingId(message.id);
    try {
      await updateMessage(message.id, !message.read);
      reload();
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Failed to update message.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMessage(deleteTarget.id);
      showToast("success", `Message from "${deleteTarget.name}" was deleted.`);
      setDeleteTarget(null);
      if (expandedId === deleteTarget.id) setExpandedId(null);
      reload();
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Failed to delete message.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Messages"
        title="Messages"
        description="Submissions from the portfolio's contact form."
      />

      <div className="admin-toolbar">
        <select
          className="admin-toolbar__select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="all">All messages</option>
          <option value="unread">Unread only</option>
          <option value="read">Read only</option>
        </select>
        <select
          className="admin-toolbar__select"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {status === "loading" && <LoadingBlock label="Loading messages…" />}

      {status === "error" && (
        <ErrorState message={errorMessage ?? "Unable to load messages."} onRetry={reload} />
      )}

      {status === "ready" && messages.length === 0 && (
        <EmptyState
          title="No messages yet."
          hint="Contact form submissions will show up here."
        />
      )}

      {status === "ready" && messages.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>From</th>
                <th>Subject</th>
                <th>Received</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {messages.map((message) => (
                <Fragment key={message.id}>
                  <tr>
                    <td>
                      <StatusBadge
                        label={message.read ? "Read" : "Unread"}
                        tone={message.read ? "neutral" : "accent"}
                      />
                    </td>
                    <td>
                      {message.name}
                      <br />
                      <span className="admin-table__muted">{message.email}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-table__expand-toggle"
                        onClick={() => toggleExpanded(message.id)}
                      >
                        {message.subject || <em className="admin-table__muted">(no subject)</em>}
                      </button>
                    </td>
                    <td className="admin-table__muted">
                      {new Date(message.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={updatingId === message.id}
                          onClick={() => handleToggleRead(message)}
                        >
                          {message.read ? "Mark unread" : "Mark read"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setDeleteTarget(message)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === message.id && (
                    <tr className="admin-table__detail">
                      <td colSpan={5}>
                        {message.message}
                        <div className="admin-table__detail-actions">
                          <a
                            className="btn btn-ghost btn-sm"
                            href={`mailto:${message.email}${
                              message.subject ? `?subject=${encodeURIComponent(`Re: ${message.subject}`)}` : ""
                            }`}
                          >
                            Reply by email
                          </a>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this message?"
        description={
          deleteTarget
            ? `The message from "${deleteTarget.name}" will be permanently removed. This can't be undone.`
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
