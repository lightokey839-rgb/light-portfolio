import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// PUBLIC SITE ONLY. This context/provider must never wrap the admin app —
// see src/admin/context/AdminThemeContext.tsx for the admin's independent
// equivalent. The two intentionally do not share a storage key, a context,
// or the "data-theme" attribute's scope, so toggling one can never affect
// the other. See App.tsx / AdminApp.tsx for where each is mounted.

export type Theme = "dark" | "light";

const STORAGE_KEY = "portfolio-theme";
// Previous key name, kept only so returning visitors don't get bounced back
// to a default theme after this rename. Safe to delete a few months out.
const LEGACY_STORAGE_KEY = "light-portfolio-theme";

function readStoredTheme(): Theme | null {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current === "light" || current === "dark") return current;

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy === "light" || legacy === "dark") {
      // Migrate forward so future reads don't need the legacy fallback.
      localStorage.setItem(STORAGE_KEY, legacy);
      return legacy;
    }
  } catch {
    // Private browsing / storage disabled.
  }
  return null;
}

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitialTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  // index.html already set data-theme synchronously before React mounted —
  // read it back rather than re-deriving it, so there's no mismatch.
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Private browsing / storage disabled — theme still works for this
      // session, it just won't persist across visits.
    }
  }, [theme]);

  // If the visitor never explicitly chose a theme on this device, keep
  // following the OS preference as it changes.
  useEffect(() => {
    const explicit = readStoredTheme() !== null;
    if (explicit) return;

    const media = window.matchMedia("(prefers-color-scheme: light)");
    const handler = (e: MediaQueryListEvent) => {
      setThemeState(e.matches ? "light" : "dark");
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);
  const toggleTheme = useCallback(
    () => setThemeState((prev) => (prev === "dark" ? "light" : "dark")),
    []
  );

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
