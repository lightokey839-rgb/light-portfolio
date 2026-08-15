import { z } from "zod";

const nullableString = (max: number) => z.string().max(max).nullable().optional();

export const technologyBaseSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(60),
  category: z.string().trim().min(2, "Category is required.").max(60),
  // Rendered as-is wherever a technology badge is shown (e.g. an emoji like
  // "⚛️"). Optional — the public site falls back to computed initials when
  // this is empty, so leaving it blank is a perfectly normal choice.
  icon: nullableString(100),
});

/** POST /technologies — name and category are required. */
export const createTechnologySchema = technologyBaseSchema;
export type CreateTechnologyInput = z.infer<typeof createTechnologySchema>;

/** PATCH /technologies/:id — every field optional; only supplied keys change. */
export const updateTechnologySchema = technologyBaseSchema.partial();
export type UpdateTechnologyInput = z.infer<typeof updateTechnologySchema>;
