import { Suspense, lazy } from "react";
import { AnimatePresence } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { SiteSettingsProvider } from "./context/SiteSettingsContext";
import AnimatedBackground from "./components/shared/AnimatedBackground";
import CursorGlow from "./components/shared/CursorGlow";
import ScrollProgress from "./components/shared/ScrollProgress";
import PageTransition from "./components/shared/PageTransition";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import WritingPage from "./pages/WritingPage";
import OpenSourcePage from "./pages/OpenSourcePage";
import LabPage from "./pages/LabPage";
import ContactPage from "./pages/ContactPage";

const AdminApp = lazy(() => import("./admin/AdminApp"));

// Lazy-loaded: these four pages pull in wagmi/viem and a full dApp's
// worth of components each. Nobody browsing the homepage or a case-study
// page should pay for that bundle weight upfront — it only loads when a
// visitor actually navigates to /lab/*.
const DexLabPage = lazy(() => import("./pages/lab/DexLabPage"));
const NftLabPage = lazy(() => import("./pages/lab/NftLabPage"));
const DaoLabPage = lazy(() => import("./pages/lab/DaoLabPage"));
const OracleLabPage = lazy(() => import("./pages/lab/OracleLabPage"));

function RouteFallback() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-sm)", color: "var(--text-1)" }}>Loading…</p>
    </div>
  );
}

/** The public site: one shared background/cursor/scroll system, one
 * shared page-transition language, mounted once so the animated
 * background never remounts (and never pops) between routes. */
function PublicSite() {
  const location = useLocation();

  return (
    <SiteSettingsProvider>
      <AnimatedBackground />
      <CursorGlow />
      <ScrollProgress />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
          <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
          <Route path="/projects" element={<PageTransition><ProjectsPage /></PageTransition>} />
          <Route path="/projects/:slug" element={<PageTransition><ProjectDetailPage /></PageTransition>} />
          <Route path="/writing" element={<PageTransition><WritingPage /></PageTransition>} />
          <Route path="/opensource" element={<PageTransition><OpenSourcePage /></PageTransition>} />
          <Route path="/lab" element={<PageTransition><LabPage /></PageTransition>} />
          <Route
            path="/lab/dex"
            element={
              <PageTransition>
                <Suspense fallback={<RouteFallback />}>
                  <DexLabPage />
                </Suspense>
              </PageTransition>
            }
          />
          <Route
            path="/lab/nft"
            element={
              <PageTransition>
                <Suspense fallback={<RouteFallback />}>
                  <NftLabPage />
                </Suspense>
              </PageTransition>
            }
          />
          <Route
            path="/lab/dao"
            element={
              <PageTransition>
                <Suspense fallback={<RouteFallback />}>
                  <DaoLabPage />
                </Suspense>
              </PageTransition>
            }
          />
          <Route
            path="/lab/oracle"
            element={
              <PageTransition>
                <Suspense fallback={<RouteFallback />}>
                  <OracleLabPage />
                </Suspense>
              </PageTransition>
            }
          />
          <Route path="/contact" element={<PageTransition><ContactPage /></PageTransition>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </SiteSettingsProvider>
  );
}

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </Suspense>
    );
  }

  return <PublicSite />;
}
