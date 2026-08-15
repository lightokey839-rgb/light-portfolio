import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import "./ProtectedRoute.css";

export default function ProtectedRoute() {
  const { status } = useAdminAuth();
  const location = useLocation();

  if (status === "checking") {
    return (
      <div className="admin-boot">
        <div className="admin-boot__spinner" aria-hidden="true" />
        <p className="admin-boot__text">Checking session…</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
