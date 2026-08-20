import { apiGet, apiPost, apiDelete } from "../lib/apiClient";

export function submitPartReplacement(equipmentId, payload) {
  return apiPost(`/api/equipment/${equipmentId}/part-replacements`, payload);
}

export function deletePartReplacement(equipmentId, replacementId) {
  return apiDelete(`/api/equipment/${equipmentId}/part-replacements/${replacementId}`);
}

export function fetchDevicePartReplacements(equipmentId) {
  return apiGet(`/api/equipment/${equipmentId}/part-replacements`);
}

export function fetchEmployeePartReplacements(employeeId) {
  return apiGet(`/api/employees/${employeeId}/part-replacements`);
}

// Global/admin history — the current source of truth for the History
// Replacement page. Replaces the old GET /api/replacements, which is gone
// for good along with the rest of /api/replacements/*.
export function fetchPartReplacements({ category, partTypeId, from, to, q } = {}) {
  const params = new URLSearchParams();
  if (category && category !== "All") params.set("category", category);
  if (partTypeId) params.set("part_type_id", partTypeId);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (q) params.set("q", q);
  const query = params.toString();
  return apiGet(`/api/part-replacements${query ? `?${query}` : ""}`);
}
