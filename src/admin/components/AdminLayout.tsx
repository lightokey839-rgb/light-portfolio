import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import "./AdminLayout.css";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/projects", label: "Projects" },
  { to: "/admin/services", label: "Services" },
  { to: "/admin/technologies", label: "Technologies" },
  { to: "/admin/messages", label: "Messages" },
  { to: "/admin/settings", label: "Settings" },
];

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    closeMenu();
    await logout();
  };

  const navLinks = (onClick?: () => void) => (
    <nav className="admin-sidebar__nav" aria-label="Admin">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onClick}
          className={({ isActive }) =>
            `admin-sidebar__link ${isActive ? "is-active" : ""}`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="admin-shell">
      {/* desktop sidebar */}
      <aside className="admin-sidebar">
        <Link to="/admin" className="admin-sidebar__logo">
          LIGHT <span>/admin</span>
        </Link>
        {navLinks()}
        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__admin">
            <span className="admin-sidebar__admin-dot" aria-hidden="true" />
            <span>{admin?.name ?? admin?.email}</span>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <div className="admin-main">
        {/* mobile topbar */}
        <header className="admin-topbar">
          <Link to="/admin" className="admin-sidebar__logo">
            LIGHT <span>/admin</span>
          </Link>
          <button
            type="button"
            className={`admin-topbar__toggle ${menuOpen ? "is-open" : ""}`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="admin-mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </header>

        {/* mobile drawer */}
        <div
          id="admin-mobile-menu"
          className={`admin-mobile-menu ${menuOpen ? "is-open" : ""}`}
        >
          {navLinks(closeMenu)}
          <div className="admin-sidebar__footer">
            <div className="admin-sidebar__admin">
              <span className="admin-sidebar__admin-dot" aria-hidden="true" />
              <span>{admin?.name ?? admin?.email}</span>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
