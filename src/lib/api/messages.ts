import { apiRequest } from "./client";
import type { Message } from "./types";

export interface ListMessagesParams {
  status?: "all" | "unread" | "read";
  sort?: "newest" | "oldest";
}

function buildQueryString(params: ListMessagesParams): string {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.sort) search.set("sort", params.sort);
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/** Admin only — requires an active session, same as the write endpoints below. */
export function listMessages(params: ListMessagesParams = {}): Promise<{ messages: Message[] }> {
  return apiRequest(`/messages${buildQueryString(params)}`);
}

export function updateMessage(id: string, read: boolean): Promise<{ message: Message }> {
  return apiRequest(`/messages/${id}`, { method: "PATCH", body: { read } });
}

export function deleteMessage(id: string): Promise<void> {
  return apiRequest(`/messages/${id}`, { method: "DELETE" });
}

/**
 * The one function in this file usable by a signed-out visitor — it's
 * what the public contact form submits to. `website` is a hidden
 * honeypot field the form renders off-screen; leave it undefined when
 * calling this from anywhere else.
 */
export interface ContactMessageInput {
  name: string;
  email: string;
  subject?: string;
  message: string;
  website?: string;
}

export function sendContactMessage(input: ContactMessageInput): Promise<{ success: boolean }> {
  return apiRequest("/messages", { method: "POST", body: input });
}
