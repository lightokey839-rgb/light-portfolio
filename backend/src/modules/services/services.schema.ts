import { z } from "zod";

const nullableString = (max: number) => z.string().max(max).nullable().optional();

export const serviceBaseSchema = z.object({
  title: z.string().trim().min(2, "Title is required.").max(100),
  description: z.string().trim().min(10, "Description is required.").max(500),
  // A short renderable badge — an emoji in the seeded data, but any short
  // string works. Optional so a service can be created before an icon's
  // been picked.
  icon: nullableString(100),
  featured: z.boolean().optional().default(false),
  sortOrder: z.coerce.number().int().optional().default(0),
});

/** POST /services — title and description are required. */
export const createServiceSchema = serviceBaseSchema;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;

/** PATCH /services/:id — every field optional; only supplied keys change. */
export const updateServiceSchema = serviceBaseSchema.partial();
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
