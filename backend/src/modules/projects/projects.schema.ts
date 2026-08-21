import { z } from "zod";

const technologyNames = z
  .array(z.string().trim().min(1).max(40))
  .max(15, "A project can list at most 15 technologies.")
  .optional();

const nullableString = (max: number) => z.string().max(max).nullable().optional();

/**
 * Accepts either a full external URL (https://…) or a root-relative path
 * (e.g. /uploads/abc.jpg, returned by our own upload endpoint). Actual
 * trimming and empty-string-to-null normalization happens in the service
 * layer, not here, to keep this schema simple.
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

const nullableText = (max: number) => z.string().trim().max(max).nullable().optional();

const stringList = (maxItems: number, maxItemLen: number) =>
  z
    .array(z.string().trim().min(1).max(maxItemLen))
    .max(maxItems)
    .optional();

const galleryUrls = z
  .array(
    z
      .string()
      .trim()
      .max(500)
      .refine(
        (v) => /^(https?:\/\/|\/)/i.test(v),
        "Each gallery image must be a full URL (https://…) or an uploaded file path (starting with /)."
      )
  )
  .max(12, "Gallery can have at most 12 images.")
  .optional();

export const projectBaseSchema = z.object({
  title: z.string().trim().min(2, "Title is required.").max(120),
  description: z.string().trim().min(10, "Description is required."),
  shortDescription: nullableString(220),
  category: z.string().trim().min(2, "Category is required.").max(60),
  imageUrl: urlLike,
  videoUrl: urlLike,
  liveUrl: urlLike,
  githubUrl: urlLike,
  featured: z.boolean().optional().default(false),
  published: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().optional().default(0),
  technologies: technologyNames,

  // Case-study fields — all optional. A project can be published with
  // none of these set; the detail page just omits that section rather
  // than showing empty/fabricated content (spec section 13).
  challenge: nullableText(2000),
  solution: nullableText(2000),
  results: nullableText(1000),
  keyFeatures: stringList(20, 160),
  gallery: galleryUrls,
});

/** POST /projects — title, description, category are required. */
export const createProjectSchema = projectBaseSchema;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

/** PATCH /projects/:id — every field optional; only supplied keys change. */
export const updateProjectSchema = projectBaseSchema.partial();
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const listProjectsQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(60).optional(),
  // Ignored for unauthenticated requests — the service always forces
  // "published" for the public, regardless of what's passed here.
  status: z.enum(["all", "published", "draft"]).optional(),
  sort: z.enum(["sortOrder", "newest", "oldest", "title"]).optional().default("sortOrder"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
