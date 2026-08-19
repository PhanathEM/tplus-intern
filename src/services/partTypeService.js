import { apiGet, apiPost, apiPut, apiDelete } from "../lib/apiClient";

export function fetchPartTypes(categoryId) {
  return apiGet(categoryId ? `/api/part-types?category_id=${categoryId}` : "/api/part-types");
}

// Which equipment column a part maps to (replacing it also updates the
// device) — leaving it unset just records replacement history.
export function fetchPartTypeColumns() {
  return apiGet("/api/part-types/columns");
}

export function fetchPartTypeCategories(partTypeId) {
  return apiGet(`/api/part-types/${partTypeId}/categories`);
}

export function updatePartTypeCategories(partTypeId, categoryIds) {
  return apiPut(`/api/part-types/${partTypeId}/categories`, { category_ids: categoryIds });
}

export function createPartType(payload) {
  return apiPost("/api/part-types", payload);
}

export function updatePartType(partTypeId, payload) {
  return apiPut(`/api/part-types/${partTypeId}`, payload);
}

// Blocked by the backend if replacement history exists for this part type —
// deactivate it instead (updatePartType with is_active: false).
export function deletePartType(partTypeId) {
  return apiDelete(`/api/part-types/${partTypeId}`);
}
