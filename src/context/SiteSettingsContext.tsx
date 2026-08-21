import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSettings } from "../lib/api/settings";
import type { SiteSettings } from "../lib/api/types";

// Matches the seeded SiteSettings values (see backend/prisma/seed.ts), so
// there's no visible flash from fallback -> fetched values on a fresh
// install — only an admin who's actually edited these in /admin/settings
// sees anything different, and only after the fetch resolves.
const FALLBACK_SETTINGS: SiteSettings = {
  id: "",
  name: "LIGHT",
  title: "Web3 Developer & Builder",
  bio: "",
  profileImage: null,
  email: null,
  telegram: "https://t.me/web3light07",
  twitter: "https://x.com/LIGHTDESIGN2022",
  github: null,
  linkedin: null,
};

const SiteSettingsContext = createContext<SiteSettings>(FALLBACK_SETTINGS);

/**
 * Fetches /settings once for the whole public site and shares it via
 * context. Mounted in PortfolioPage.tsx. Previously Hero fetched this
 * itself while Contact and Footer hardcoded links from src/data/site.ts
 * instead — meaning editing socials in /admin/settings silently didn't
 * reach two of the three places they're shown. This fixes that and cuts
 * three independent /settings requests down to one.
 */
export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(FALLBACK_SETTINGS);

  useEffect(() => {
    let cancelled = false;

    getSettings()
      .then(({ settings }) => {
        if (!cancelled) setSettings(settings);
      })
      .catch((err) => {
        console.error("Failed to load site settings:", err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteSettings {
  return useContext(SiteSettingsContext);
}
