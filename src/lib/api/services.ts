import { apiRequest } from "./client";
import type { Service } from "./types";

export function listServices(): Promise<{ services: Service[] }> {
  return apiRequest("/services");
}

export function getService(id: string): Promise<{ service: Service }> {
  return apiRequest(`/services/${id}`);
}

export interface ServiceInput {
  title: string;
  description: string;
  icon: string | null;
  featured: boolean;
  sortOrder: number;
}

export function createService(input: ServiceInput): Promise<{ service: Service }> {
  return apiRequest("/services", { method: "POST", body: input });
}

export function updateService(
  id: string,
  input: Partial<ServiceInput>
): Promise<{ service: Service }> {
  return apiRequest(`/services/${id}`, { method: "PATCH", body: input });
}

export function deleteService(id: string): Promise<void> {
  return apiRequest(`/services/${id}`, { method: "DELETE" });
}
