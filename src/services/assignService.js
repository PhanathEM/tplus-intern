import { apiGet, apiPost } from "../lib/apiClient";

export function fetchAssignFormData() {
  return apiGet("/api/assign/form-data");
}

export function fetchAssignableEquipment({ q, category } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category && category !== "All") params.set("category", category);
  const query = params.toString();
  return apiGet(`/api/assign/available${query ? `?${query}` : ""}`);
}

export function fetchAssignEmployees({ position, department, q } = {}) {
  const params = new URLSearchParams();
  if (position) params.set("position", position);
  if (department) params.set("department", department);
  if (q) params.set("q", q);
  const query = params.toString();
  return apiGet(`/api/assign/employees${query ? `?${query}` : ""}`);
}

export function submitAssign(payload) {
  return apiPost("/api/assign", payload);
}
