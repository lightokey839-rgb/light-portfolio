import { apiRequest } from "./client";
import type { SiteSettings } from "./types";

/** Public — this is what the live site reads for name/title/bio/socials. */
export function getSettings(): Promise<{ settings: SiteSettings }> {
  return apiRequest("/settings");
}

export interface SettingsInput {
  name: string;
  title: string;
  bio: string;
  profileImage: string | null;
  email: string | null;
  telegram: string | null;
  twitter: string | null;
  github: string | null;
  linkedin: string | null;
}

export function updateSettings(
  input: Partial<SettingsInput>
): Promise<{ settings: SiteSettings }> {
  return apiRequest("/settings", { method: "PATCH", body: input });
}
