import type { Prisma, PrismaClient, Project, Technology } from "@prisma/client";
import type {
  CreateProjectInput,
  ListProjectsQuery,
  UpdateProjectInput,
} from "./projects.schema.js";

export type ProjectWithTechnologies = Project & { technologies: Technology[] };

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "project";
}

/**
 * Slugs are generated once, from the title, at creation time — and never
 * silently regenerated on update, even if the title changes. Once a
 * project has a URL, editing the title shouldn't break it.
 */
async function uniqueSlug(prisma: PrismaClient, title: string): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let suffix = 2;

  while (await prisma.project.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function normalizeNullable(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Resolves free-text technology names (as typed into the project form's
 * tag input) into Technology records to connect, matching case-
 * insensitively against what already exists so "react" and "React" don't
 * create duplicates. Anything genuinely new is created with category
 * "Other" — from there it's a normal Technology row, editable (including
 * re-categorizing it) from /admin/technologies like any other.
 */
async function resolveTechnologyConnections(
  prisma: PrismaClient,
  names: string[]
): Promise<{ id: string }[]> {
  const seen = new Set<string>();
  const connections: { id: string }[] = [];

  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const existing = await prisma.technology.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
      select: { id: true },
    });

    if (existing) {
      connections.push({ id: existing.id });
    } else {
      const created = await prisma.technology.create({
        data: { name, category: "Other" },
        select: { id: true },
      });
      connections.push({ id: created.id });
    }
  }

  return connections;
}

export interface ListProjectsResult {
  projects: ProjectWithTechnologies[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listProjects(
  prisma: PrismaClient,
  query: ListProjectsQuery,
  isAdmin: boolean
): Promise<ListProjectsResult> {
  const where: Prisma.ProjectWhereInput = {};

  if (!isAdmin) {
    where.published = true;
  } else if (query.status === "published") {
    where.published = true;
  } else if (query.status === "draft") {
    where.published = false;
  }
  // status === "all" (or omitted) as admin: no published filter.

  if (query.category) {
    where.category = query.category;
  }

  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
      { category: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.ProjectOrderByWithRelationInput[] =
    query.sort === "newest"
      ? [{ createdAt: "desc" }]
      : query.sort === "oldest"
        ? [{ createdAt: "asc" }]
        : query.sort === "title"
          ? [{ title: "asc" }]
          : [{ sortOrder: "asc" }, { createdAt: "desc" }];

  const [total, projects] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { technologies: true },
    }),
  ]);

  return { projects, total, page: query.page, pageSize: query.pageSize };
}

export async function getProjectById(
  prisma: PrismaClient,
  id: string,
  isAdmin: boolean
): Promise<ProjectWithTechnologies | null> {
  const project = await prisma.project.findUnique({
    where: { id },
    include: { technologies: true },
  });

  if (!project) return null;
  // Unpublished projects are invisible to anyone without a session —
  // returning null (-> 404) rather than a 403 avoids confirming that a
  // draft with this id exists at all.
  if (!isAdmin && !project.published) return null;

  return project;
}

/**
 * Same visibility rule as getProjectById, keyed by slug instead — used by
 * the public case-study route (/projects/:slug) so project detail pages
 * don't need to expose the internal cuid in the URL.
 */
export async function getProjectBySlug(
  prisma: PrismaClient,
  slug: string,
  isAdmin: boolean
): Promise<ProjectWithTechnologies | null> {
  const project = await prisma.project.findUnique({
    where: { slug },
    include: { technologies: true },
  });

  if (!project) return null;
  if (!isAdmin && !project.published) return null;

  return project;
}

export async function createProject(
  prisma: PrismaClient,
  input: CreateProjectInput
): Promise<ProjectWithTechnologies> {
  const slug = await uniqueSlug(prisma, input.title);
  const technologyConnections = await resolveTechnologyConnections(
    prisma,
    input.technologies ?? []
  );

  return prisma.project.create({
    data: {
      title: input.title,
      slug,
      description: input.description,
      shortDescription: normalizeNullable(input.shortDescription),
      imageUrl: normalizeNullable(input.imageUrl),
      videoUrl: normalizeNullable(input.videoUrl),
      liveUrl: normalizeNullable(input.liveUrl),
      githubUrl: normalizeNullable(input.githubUrl),
      category: input.category,
      featured: input.featured ?? false,
      published: input.published ?? true,
      sortOrder: input.sortOrder ?? 0,
      technologies: { connect: technologyConnections },
      challenge: normalizeNullable(input.challenge),
      solution: normalizeNullable(input.solution),
      results: normalizeNullable(input.results),
      keyFeatures: input.keyFeatures ?? [],
      gallery: input.gallery ?? [],
    },
    include: { technologies: true },
  });
}

export async function updateProject(
  prisma: PrismaClient,
  id: string,
  input: UpdateProjectInput
): Promise<ProjectWithTechnologies> {
  const data: Prisma.ProjectUpdateInput = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.shortDescription !== undefined) {
    data.shortDescription = normalizeNullable(input.shortDescription);
  }
  if (input.imageUrl !== undefined) data.imageUrl = normalizeNullable(input.imageUrl);
  if (input.videoUrl !== undefined) data.videoUrl = normalizeNullable(input.videoUrl);
  if (input.liveUrl !== undefined) data.liveUrl = normalizeNullable(input.liveUrl);
  if (input.githubUrl !== undefined) data.githubUrl = normalizeNullable(input.githubUrl);
  if (input.category !== undefined) data.category = input.category;
  if (input.featured !== undefined) data.featured = input.featured;
  if (input.published !== undefined) data.published = input.published;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

  if (input.technologies !== undefined) {
    const technologyConnections = await resolveTechnologyConnections(prisma, input.technologies);
    data.technologies = { set: [], connect: technologyConnections };
  }

  if (input.challenge !== undefined) data.challenge = normalizeNullable(input.challenge);
  if (input.solution !== undefined) data.solution = normalizeNullable(input.solution);
  if (input.results !== undefined) data.results = normalizeNullable(input.results);
  if (input.keyFeatures !== undefined) data.keyFeatures = input.keyFeatures;
  if (input.gallery !== undefined) data.gallery = input.gallery;

  return prisma.project.update({
    where: { id },
    data,
    include: { technologies: true },
  });
}

export async function deleteProject(prisma: PrismaClient, id: string): Promise<void> {
  await prisma.project.delete({ where: { id } });
}
