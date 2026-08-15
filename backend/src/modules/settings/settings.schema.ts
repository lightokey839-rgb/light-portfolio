import { z } from "zod";

/**
 * Same shape as projects.schema.ts's urlLike: a full external URL, or a
 * root-relative path returned by our own upload endpoint. Empty string is
 * allowed through here and normalized to null in the service layer, same
 * pattern as the rest of the API.
 */
const urlLike = z
  .string()
  .max(500)
  .refine(
    (v) => v.trim() === "" || /^(https?:\/\/|\/)/i.test(v.trim()),
    "Must be a full URL (https://…) or an uploaded file path (starting with /)."
  )
  .nullable()
  .optional();

const emailLike = z
  .string()
  .max(200)
  .refine(
    (v) => v.trim() === "" || z.string().email().safeParse(v.trim()).success,
    "Must be a valid email address."
  )
  .nullable()
  .optional();

export const settingsBaseSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  title: z.string().trim().min(1, "Title is required.").max(150),
  bio: z.string().trim().min(1, "Bio is required.").max(2000),
  profileImage: urlLike,
  email: emailLike,
  telegram: urlLike,
  twitter: urlLike,
  github: urlLike,
  linkedin: urlLike,
});

/** PATCH /settings — every field optional; only supplied keys change. There's
 * no create/POST route: the one settings row always exists (seeded, and
 * lazily created on first read otherwise — see settings.service.ts). */
export const updateSettingsSchema = settingsBaseSchema.partial();
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
