import { Route, Routes } from "react-router-dom";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { ToastProvider } from "./components/ToastProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProjectsListPage from "./pages/ProjectsListPage";
import ProjectFormPage from "./pages/ProjectFormPage";
import ServicesListPage from "./pages/ServicesListPage";
import ServiceFormPage from "./pages/ServiceFormPage";
import TechnologiesListPage from "./pages/TechnologiesListPage";
import TechnologyFormPage from "./pages/TechnologyFormPage";
import MessagesListPage from "./pages/MessagesListPage";
import SettingsPage from "./pages/SettingsPage";
import AdminNotFoundPage from "./pages/AdminNotFoundPage";

export default function AdminApp() {
  return (
    <ToastProvider>
      <AdminAuthProvider>
        <Routes>
          <Route path="login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="projects" element={<ProjectsListPage />} />
              <Route path="projects/new" element={<ProjectFormPage />} />
              <Route path="projects/:id/edit" element={<ProjectFormPage />} />
              <Route path="services" element={<ServicesListPage />} />
              <Route path="services/new" element={<ServiceFormPage />} />
              <Route path="services/:id/edit" element={<ServiceFormPage />} />
              <Route path="technologies" element={<TechnologiesListPage />} />
              <Route path="technologies/new" element={<TechnologyFormPage />} />
              <Route path="technologies/:id/edit" element={<TechnologyFormPage />} />
              <Route path="messages" element={<MessagesListPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<AdminNotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </AdminAuthProvider>
    </ToastProvider>
  );
}
