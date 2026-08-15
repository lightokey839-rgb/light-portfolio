import { z } from "zod";

/**
 * POST /messages is the one public, unauthenticated *write* endpoint in
 * this API (it backs the portfolio's contact form), which makes it the
 * most likely target for spam. `website` is a honeypot: it's rendered
 * hidden on the real form, so only a bot filling every field blindly
 * would ever populate it. The route treats a non-empty value as spam —
 * see messages.service.ts.
 */
export const createMessageSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  email: z.string().trim().email("Enter a valid email address.").max(200),
  subject: z.string().max(200).nullable().optional(),
  message: z.string().trim().min(10, "Message is too short.").max(5000),
  website: z.string().trim().max(200).optional(),
});
export type CreateMessageInput = z.infer<typeof createMessageSchema>;

export const listMessagesQuerySchema = z.object({
  status: z.enum(["all", "unread", "read"]).optional().default("all"),
  sort: z.enum(["newest", "oldest"]).optional().default("newest"),
});
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;

/** PATCH /messages/:id — the only thing about a message you can change. */
export const updateMessageSchema = z.object({
  read: z.boolean(),
});
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
