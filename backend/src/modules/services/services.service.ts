import type { PrismaClient, Service } from "@prisma/client";
import type { CreateServiceInput, UpdateServiceInput } from "./services.schema.js";

function normalizeNullable(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Like Technology, Service has no `published` flag — every row is always
 * public, so there's no isAdmin branching here. Ordered by sortOrder (the
 * admin-controlled manual order shown in "What I Build") then creation
 * time, matching how Project's default sort works.
 */
export async function listServices(prisma: PrismaClient): Promise<Service[]> {
  return prisma.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function getServiceById(prisma: PrismaClient, id: string): Promise<Service | null> {
  return prisma.service.findUnique({ where: { id } });
}

export async function createService(
  prisma: PrismaClient,
  input: CreateServiceInput
): Promise<Service> {
  return prisma.service.create({
    data: {
      title: input.title,
      description: input.description,
      icon: normalizeNullable(input.icon) ?? null,
      featured: input.featured ?? false,
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function updateService(
  prisma: PrismaClient,
  id: string,
  input: UpdateServiceInput
): Promise<Service> {
  return prisma.service.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.icon !== undefined ? { icon: normalizeNullable(input.icon) } : {}),
      ...(input.featured !== undefined ? { featured: input.featured } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    },
  });
}

export async function deleteService(prisma: PrismaClient, id: string): Promise<void> {
  await prisma.service.delete({ where: { id } });
}
