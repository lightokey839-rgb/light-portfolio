import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { login as apiLogin, logout as apiLogout, me as apiMe } from "../../lib/api/auth";
import type { AdminUser } from "../../lib/api/types";

type SessionStatus = "checking" | "authenticated" | "unauthenticated";

interface AdminAuthValue {
  admin: AdminUser | null;
  status: SessionStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>("checking");

  // Restore the session on load (and on every full page refresh) by
  // asking the API whether the httpOnly cookie is still valid — this is
  // what makes "stay logged in" work without storing anything client-side.
  useEffect(() => {
    let cancelled = false;

    apiMe()
      .then(({ admin }) => {
        if (!cancelled) {
          setAdmin(admin);
          setStatus("authenticated");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAdmin(null);
          setStatus("unauthenticated");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { admin } = await apiLogin(email, password);
    setAdmin(admin);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Even if the request fails (e.g. network hiccup), still clear
      // local state — the cookie will simply expire on its own.
    }
    setAdmin(null);
    setStatus("unauthenticated");
  }, []);

  return (
    <AdminAuthContext.Provider value={{ admin, status, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used inside an AdminAuthProvider");
  }
  return ctx;
}
