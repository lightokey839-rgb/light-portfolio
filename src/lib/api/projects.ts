import { apiRequest } from "./client";
import type { Project } from "./types";

export interface ListProjectsParams {
  q?: string;
  category?: string;
  status?: "all" | "published" | "draft";
  sort?: "sortOrder" | "newest" | "oldest" | "title";
  page?: number;
  pageSize?: number;
}

export interface ListProjectsResult {
  projects: Project[];
  total: number;
  page: number;
  pageSize: number;
}

function buildQueryString(params: ListProjectsParams): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  if (params.status) search.set("status", params.status);
  if (params.sort) search.set("sort", params.sort);
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function listProjects(params: ListProjectsParams = {}): Promise<ListProjectsResult> {
  return apiRequest(`/projects${buildQueryString(params)}`);
}

export function getProject(id: string): Promise<{ project: Project }> {
  return apiRequest(`/projects/${id}`);
}

/** Used by the public case-study route (/projects/:slug). */
export function getProjectBySlug(slug: string): Promise<{ project: Project }> {
  return apiRequest(`/projects/slug/${slug}`);
}

export interface ProjectInput {
  title: string;
  description: string;
  shortDescription: string | null;
  category: string;
  imageUrl: string | null;
  videoUrl: string | null;
  liveUrl: string | null;
  githubUrl: string | null;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  technologies: string[];
  challenge: string | null;
  solution: string | null;
  results: string | null;
  keyFeatures: string[];
  gallery: string[];
}

export function createProject(input: ProjectInput): Promise<{ project: Project }> {
  return apiRequest("/projects", { method: "POST", body: input });
}

export function updateProject(
  id: string,
  input: Partial<ProjectInput>
): Promise<{ project: Project }> {
  return apiRequest(`/projects/${id}`, { method: "PATCH", body: input });
}

export function deleteProject(id: string): Promise<void> {
  return apiRequest(`/projects/${id}`, { method: "DELETE" });
}
