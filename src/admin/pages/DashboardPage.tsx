import { Link } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useAdminResource } from "../hooks/useAdminResource";
import { listProjects } from "../../lib/api/projects";
import { listServices } from "../../lib/api/services";
import { listTechnologies } from "../../lib/api/technologies";
import { listMessages } from "../../lib/api/messages";
import { StatCard } from "../components/StatCard";
import "./DashboardPage.css";

export default function DashboardPage() {
  const { admin } = useAdminAuth();

  // 100 is the API's hard cap on pageSize — plenty for a personal
  // portfolio's project count, and anything higher gets rejected outright.
  const projects = useAdminResource(() => listProjects({ pageSize: 100, status: "all" }));
  const services = useAdminResource(listServices);
  const technologies = useAdminResource(listTechnologies);
  const messages = useAdminResource(listMessages);

  const projectList = projects.data?.projects ?? [];
  const publishedCount = projectList.filter((p) => p.published).length;
  const draftCount = projectList.filter((p) => !p.published).length;
  const unreadCount = (messages.data?.messages ?? []).filter((m) => !m.read).length;

  return (
    <div className="dashboard-page">
      <header className="dashboard-page__header">
        <p className="eyebrow">Dashboard</p>
        <h1>Welcome back{admin?.name ? `, ${admin.name}` : ""}.</h1>
        <p className="dashboard-page__sub">Here's the current state of your portfolio.</p>
      </header>

      <div className="dashboard-page__grid">
        <StatCard
          label="Total projects"
          value={projectList.length}
          loading={projects.status === "loading"}
          errored={projects.status === "error"}
        />
        <StatCard
          label="Published projects"
          value={publishedCount}
          loading={projects.status === "loading"}
          errored={projects.status === "error"}
        />
        <StatCard
          label="Draft projects"
          value={draftCount}
          loading={projects.status === "loading"}
          errored={projects.status === "error"}
        />
        <StatCard
          label="Total services"
          value={services.data?.services.length ?? 0}
          loading={services.status === "loading"}
          errored={services.status === "error"}
        />
        <StatCard
          label="Total technologies"
          value={technologies.data?.technologies.length ?? 0}
          loading={technologies.status === "loading"}
          errored={technologies.status === "error"}
        />
        <StatCard
          label="Unread messages"
          value={unreadCount}
          loading={messages.status === "loading"}
          errored={messages.status === "error"}
        />
      </div>

      <div className="dashboard-page__quicklinks">
        <Link to="/admin/projects" className="btn btn-ghost btn-sm">
          Manage projects
        </Link>
        <Link to="/admin/messages" className="btn btn-ghost btn-sm">
          View messages
        </Link>
        <Link to="/admin/settings" className="btn btn-ghost btn-sm">
          Edit site settings
        </Link>
      </div>
    </div>
  );
}
