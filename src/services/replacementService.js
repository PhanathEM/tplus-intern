import { apiGet, apiPost } from "../lib/apiClient";

export function fetchReplacements({ category, q, from, to } = {}) {
  const params = new URLSearchParams();
  if (category && category !== "All") params.set("category", category);
  if (q) params.set("q", q);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();
  return apiGet(`/api/replacements${query ? `?${query}` : ""}`);
}

// Devices that currently have an owner — the opposite of /api/assign/available.
export function fetchReplaceableEquipment({ q, category, employee_id } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category && category !== "All") params.set("category", category);
  if (employee_id) params.set("employee_id", employee_id);
  const query = params.toString();
  return apiGet(`/api/replacements/replaceable${query ? `?${query}` : ""}`);
}

export function submitReplacement(payload) {
  return apiPost("/api/replacements", payload);
}
