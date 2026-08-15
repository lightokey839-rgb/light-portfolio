import { apiRequest } from "./client";
import type { AdminUser } from "./types";

export function login(email: string, password: string): Promise<{ admin: AdminUser }> {
  return apiRequest("/auth/login", { method: "POST", body: { email, password } });
}

export function me(): Promise<{ admin: AdminUser }> {
  return apiRequest("/auth/me");
}

export function logout(): Promise<{ success: boolean }> {
  return apiRequest("/auth/logout", { method: "POST" });
}
