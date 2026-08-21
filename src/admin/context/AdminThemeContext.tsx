import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import "../adminTheme.css";

// ADMIN ONLY. This is a deliberately separate context from
// src/context/ThemeContext.tsx (the public site's). Nothing here reads
// from, writes to, or listens to the public theme in any way:
//
//  - separate localStorage key ("admin-theme" vs "portfolio-theme")
//  - separate React context, mounted only inside AdminApp
//  - separate attribute ("data-admin-theme"), applied to a wrapper div
//    scoped to the admin subtree — never to document.documentElement,
//    so it can never collide with the public site's "data-theme" attr
//  - separate token block in adminTheme.css (.admin-root / .admin-root
//    [data-admin-theme="light"]) that fully redefines every design-token
//    CSS variable the admin UI uses, rather than inheriting from :root.
//    That last point is what makes the isolation real: even if the public
//    site's :root tokens are currently in light mode, .admin-root's own
//    dark-mode block still wins for anything inside it, because a CSS
//    custom property set on a closer ancestor always beats one set
//    further up the tree. There is no shared state to accidentally leak
//    through — only a shared *pattern* (context + localStorage + data
//    attribute) that happens to look similar by design, for maintainability.
//
// The admin has two modes only (no "system" option) — see spec section 2.

export type AdminTheme = "dark" | "light";

const STORAGE_KEY = "admin-theme";

interface AdminThemeContextValue {
  theme: AdminTheme;
  toggleTheme: () => void;
  setTheme: (theme: AdminTheme) => void;
}

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

function readInitialAdminTheme(): AdminTheme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Private browsing / storage disabled.
  }
  // Admin default is dark, independent of the public site's default or
  // current state and independent of OS preference — an explicit product
  // choice, not a fallback trying to mirror something else.
  return "dark";
}

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AdminTheme>(readInitialAdminTheme);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Private browsing / storage disabled — still works for this session.
    }
  }, [theme]);

  const setTheme = useCallback((next: AdminTheme) => setThemeState(next), []);
  const toggleTheme = useCallback(
    () => setThemeState((prev) => (prev === "dark" ? "light" : "dark")),
    []
  );

  return (
    <AdminThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {/*
        This div is the entire isolation boundary. It wraps LoginPage too
        (not just the authenticated AdminLayout), since AdminThemeProvider
        sits above the <Routes> in AdminApp.tsx — see there.
      */}
      <div className="admin-root" data-admin-theme={theme}>
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme(): AdminThemeContextValue {
  const ctx = useContext(AdminThemeContext);
  if (!ctx) {
    throw new Error("useAdminTheme must be used within an AdminThemeProvider");
  }
  return ctx;
}
