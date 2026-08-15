import { apiRequest } from "./client";
import type { Technology } from "./types";

export function listTechnologies(): Promise<{ technologies: Technology[] }> {
  return apiRequest("/technologies");
}

export function getTechnology(id: string): Promise<{ technology: Technology }> {
  return apiRequest(`/technologies/${id}`);
}

export interface TechnologyInput {
  name: string;
  category: string;
  icon: string | null;
}

export function createTechnology(input: TechnologyInput): Promise<{ technology: Technology }> {
  return apiRequest("/technologies", { method: "POST", body: input });
}

export function updateTechnology(
  id: string,
  input: Partial<TechnologyInput>
): Promise<{ technology: Technology }> {
  return apiRequest(`/technologies/${id}`, { method: "PATCH", body: input });
}

export function deleteTechnology(id: string): Promise<void> {
  return apiRequest(`/technologies/${id}`, { method: "DELETE" });
}
