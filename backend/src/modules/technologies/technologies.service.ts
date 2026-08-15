import type { PrismaClient, Technology } from "@prisma/client";
import type { CreateTechnologyInput, UpdateTechnologyInput } from "./technologies.schema.js";

function normalizeNullable(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Unlike Project, Technology has no `published` flag — every row is always
 * public, so (unlike projects.service.ts) there's no isAdmin branching here
 * at all. Ordered by category then name so callers that group by category
 * (the public tech-stack section, the admin list) get a stable, readable
 * order without needing their own sort pass.
 */
export async function listTechnologies(prisma: PrismaClient): Promise<Technology[]> {
  return prisma.technology.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function getTechnologyById(
  prisma: PrismaClient,
  id: string
): Promise<Technology | null> {
  return prisma.technology.findUnique({ where: { id } });
}

export async function createTechnology(
  prisma: PrismaClient,
  input: CreateTechnologyInput
): Promise<Technology> {
  return prisma.technology.create({
    data: {
      name: input.name,
      category: input.category,
      icon: normalizeNullable(input.icon) ?? null,
    },
  });
}

export async function updateTechnology(
  prisma: PrismaClient,
  id: string,
  input: UpdateTechnologyInput
): Promise<Technology> {
  return prisma.technology.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.icon !== undefined ? { icon: normalizeNullable(input.icon) } : {}),
    },
  });
}

/**
 * Technology <-> Project is an implicit many-to-many, so Prisma just drops
 * the join-table rows for any connected projects — no FK error, no
 * cascade to configure, and no project ever ends up with a dangling
 * reference. Safe to delete a technology that's currently in use.
 */
export async function deleteTechnology(prisma: PrismaClient, id: string): Promise<void> {
  await prisma.technology.delete({ where: { id } });
}
