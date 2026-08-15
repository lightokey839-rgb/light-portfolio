import type { PrismaClient, SiteSettings } from "@prisma/client";
import type { UpdateSettingsInput } from "./settings.schema.js";

/** Falls back to this if a database is ever queried before `npm run seed`
 * has run — GET /settings is public, so it should never 404 or 500 just
 * because the one-time seed step was skipped. */
const FALLBACK_DEFAULTS = {
  name: "Portfolio Owner",
  title: "Web3 Developer & Builder",
  bio: "Bio not set yet — edit this from /admin/settings.",
};

function normalizeNullable(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * SiteSettings is a singleton table — there's always exactly one row once
 * the app has been used. `findFirst` + create-if-missing means every
 * caller (public GET, admin PATCH) can treat "the settings row" as
 * unconditionally available without its own existence check.
 */
async function ensureSettingsRow(prisma: PrismaClient): Promise<SiteSettings> {
  const existing = await prisma.siteSettings.findFirst();
  if (existing) return existing;
  return prisma.siteSettings.create({ data: FALLBACK_DEFAULTS });
}

export async function getSettings(prisma: PrismaClient): Promise<SiteSettings> {
  return ensureSettingsRow(prisma);
}

export async function updateSettings(
  prisma: PrismaClient,
  input: UpdateSettingsInput
): Promise<SiteSettings> {
  const current = await ensureSettingsRow(prisma);

  return prisma.siteSettings.update({
    where: { id: current.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.bio !== undefined ? { bio: input.bio } : {}),
      ...(input.profileImage !== undefined
        ? { profileImage: normalizeNullable(input.profileImage) }
        : {}),
      ...(input.email !== undefined ? { email: normalizeNullable(input.email) } : {}),
      ...(input.telegram !== undefined ? { telegram: normalizeNullable(input.telegram) } : {}),
      ...(input.twitter !== undefined ? { twitter: normalizeNullable(input.twitter) } : {}),
      ...(input.github !== undefined ? { github: normalizeNullable(input.github) } : {}),
      ...(input.linkedin !== undefined ? { linkedin: normalizeNullable(input.linkedin) } : {}),
    },
  });
}
