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
// separate from Equipment's own custom-fields system. Definitions are
// global/shared across part types; which ones a given part type shows is
// controlled by its stock-columns selection below, not an attach/detach
// call — "+ Add field" just creates the shared definition.
export function fetchPartCustomFields() {
  return apiGet("/api/part-custom-fields");
}

export function fetchPartCustomFieldTypes() {
  return apiGet("/api/part-custom-fields/types");
}

export function createPartCustomField(payload) {
  return apiPost("/api/part-custom-fields", payload);
}

// The Add/Edit Part Type form's "Stock columns" picker: built-in
// part_stock fields (model_name, location, ram_type...) plus reusable
// custom fields, and which ones a given part type currently shows.
export function fetchStockColumnOptions() {
  return apiGet("/api/part-types/stock-columns");
}

export function fetchPartTypeStockColumns(partTypeId) {
  return apiGet(`/api/part-types/${partTypeId}/stock-columns`);
}

export function updatePartTypeStockColumns(partTypeId, columns) {
  return apiPut(`/api/part-types/${partTypeId}/stock-columns`, { columns });
}
