import type { Message, Prisma, PrismaClient } from "@prisma/client";
import type { CreateMessageInput, ListMessagesQuery, UpdateMessageInput } from "./messages.schema.js";

function normalizeNullable(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export async function listMessages(
  prisma: PrismaClient,
  query: ListMessagesQuery
): Promise<Message[]> {
  const where: Prisma.MessageWhereInput = {};

  if (query.status === "unread") where.read = false;
  if (query.status === "read") where.read = true;

  return prisma.message.findMany({
    where,
    orderBy: { createdAt: query.sort === "oldest" ? "asc" : "desc" },
  });
}

/**
 * Returns the created row, or `null` if the honeypot field was filled in
 * (i.e. almost certainly a bot) — in which case nothing is written to the
 * database at all. The route responds identically either way, so there's
 * no observable difference that would let a bot learn its submission was
 * discarded.
 */
export async function createMessage(
  prisma: PrismaClient,
  input: CreateMessageInput
): Promise<Message | null> {
  if (input.website && input.website.trim() !== "") {
    return null;
  }

  return prisma.message.create({
    data: {
      name: input.name,
      email: input.email,
      subject: normalizeNullable(input.subject) ?? null,
      message: input.message,
    },
  });
}

export async function updateMessage(
  prisma: PrismaClient,
  id: string,
  input: UpdateMessageInput
): Promise<Message> {
  return prisma.message.update({
    where: { id },
    data: { read: input.read },
  });
}

export async function deleteMessage(prisma: PrismaClient, id: string): Promise<void> {
  await prisma.message.delete({ where: { id } });
}
