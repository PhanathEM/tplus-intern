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

// Custom fields for Part Stock entries (e.g. Color, Serial Number) —
// separate from Equipment's own custom-fields system. GET /api/part-types
// also returns each part type's attached fields as a `custom_fields` array.
export function fetchPartCustomFields() {
  return apiGet("/api/part-custom-fields");
}

export function fetchPartCustomFieldTypes() {
  return apiGet("/api/part-custom-fields/types");
}

export function fetchPartTypeCustomFields(partTypeId) {
  return apiGet(`/api/part-custom-fields/part-type/${partTypeId}`);
}

export function createPartCustomField(payload) {
  return apiPost("/api/part-custom-fields", payload);
}

export function attachPartCustomField(partTypeId, fieldId) {
  return apiPost(`/api/part-custom-fields/part-type/${partTypeId}/attach`, { field_id: fieldId });
}

export function detachPartCustomField(partTypeId, fieldId) {
  return apiDelete(`/api/part-custom-fields/part-type/${partTypeId}/field/${fieldId}`);
}

export function updatePartCustomField(fieldId, payload) {
  return apiPut(`/api/part-custom-fields/${fieldId}`, payload);
}

export function deletePartCustomFieldDefinition(fieldId) {
  return apiDelete(`/api/part-custom-fields/${fieldId}`);
}
