import { Navigate, Route, Routes } from "react-router-dom";
import PortfolioPage from "./pages/PortfolioPage";
import AdminApp from "./admin/AdminApp";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PortfolioPage />} />
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
