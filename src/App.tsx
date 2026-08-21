import { Navigate, Route, Routes } from "react-router-dom";
import PortfolioPage from "./pages/PortfolioPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import AdminApp from "./admin/AdminApp";
import { SiteSettingsProvider } from "./context/SiteSettingsContext";

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <SiteSettingsProvider>
            <PortfolioPage />
          </SiteSettingsProvider>
        }
      />
      <Route
        path="/projects/:slug"
        element={
          <SiteSettingsProvider>
            <ProjectDetailPage />
          </SiteSettingsProvider>
        }
      />
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
