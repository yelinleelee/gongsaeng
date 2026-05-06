import { api } from "./api";
import type { Property, PropertyFilters, PropertyInput } from "../types/property";

function buildQuery(filters: PropertyFilters): string {
  const params = new URLSearchParams();
  if (filters.city) params.set("city", filters.city);
  if (filters.property_type) params.set("property_type", filters.property_type);
  if (filters.min_price != null) params.set("min_price", String(filters.min_price));
  if (filters.max_price != null) params.set("max_price", String(filters.max_price));
  if (filters.guests != null) params.set("guests", String(filters.guests));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function listProperties(filters: PropertyFilters = {}): Promise<Property[]> {
  return api<Property[]>(`/properties${buildQuery(filters)}`);
}

export function getProperty(id: number): Promise<Property> {
  return api<Property>(`/properties/${id}`);
}

export function listMyProperties(): Promise<Property[]> {
  return api<Property[]>("/host/properties");
}

export function createProperty(input: PropertyInput): Promise<Property> {
  return api<Property>("/properties", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProperty(id: number, input: PropertyInput): Promise<Property> {
  return api<Property>(`/properties/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteProperty(id: number): Promise<{ ok: boolean }> {
  return api<{ ok: boolean }>(`/properties/${id}`, { method: "DELETE" });
}
