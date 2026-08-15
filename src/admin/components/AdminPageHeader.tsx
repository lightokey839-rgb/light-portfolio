import type { ReactNode } from "react";
import "./AdminPageHeader.css";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="admin-page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="admin-page-header__desc">{description}</p>}
      </div>
      {action && <div className="admin-page-header__action">{action}</div>}
    </header>
  );
}
