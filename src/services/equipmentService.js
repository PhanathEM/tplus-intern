import { apiGet, apiPost, apiPut, apiDelete } from "../lib/apiClient";

export function fetchEquipmentCategorySummary() {
  return apiGet("/api/equipment/categories");
}

export function fetchEquipmentByCategory(category, status) {
  const params = new URLSearchParams({ category });
  if (status && status !== "All") params.set("status", status);
  return apiGet(`/api/equipment?${params.toString()}`);
}

export function fetchEquipmentStatuses() {
  return apiGet("/api/statuses");
}

export function fetchEquipmentViews() {
  return apiGet("/api/equipment/views");
}

export function fetchEquipmentByView(view) {
  return apiGet(`/api/equipment/${view}`);
}

export function createEquipmentByView(view, payload) {
  return apiPost(`/api/equipment/${view}`, payload);
}

export function updateEquipmentByView(view, equipmentId, payload) {
  return apiPut(`/api/equipment/${view}/${equipmentId}`, payload);
}

export function deleteEquipmentItem(equipmentId) {
  return apiDelete(`/api/equipment/${equipmentId}`);
}

export function fetchViewColumnsSummary() {
  return apiGet("/api/view-columns");
}

export function fetchAvailableViewFields() {
  return apiGet("/api/view-columns/available-fields");
}

export function fetchViewColumns(categoryId) {
  return apiGet(`/api/view-columns/${categoryId}`);
}

export function saveViewColumns(categoryId, columns) {
  return apiPut(`/api/view-columns/${categoryId}`, { columns });
}

// Returns { fields: [...attached to this category], available_to_add: [...existing fields not yet attached] }
export function fetchCustomFields(categoryId) {
  return apiGet(`/api/custom-fields/category/${categoryId}`);
}

// Every custom field ever created, across all categories — used to offer
// reuse of an existing field instead of creating a duplicate.
export function fetchAllCustomFields() {
  return apiGet("/api/custom-fields");
}

export function fetchCustomFieldTypes() {
  return apiGet("/api/custom-fields/types");
}

export function createCustomField(categoryId, payload) {
  return apiPost("/api/custom-fields", { ...payload, category_id: categoryId });
}

export function updateCustomField(fieldId, payload) {
  return apiPut(`/api/custom-fields/field/${fieldId}`, payload);
}

// Removes a field from just this one category (unlinks; doesn't touch other
// categories that reuse the same field).
export function removeCustomFieldFromCategory(categoryId, fieldId, confirm = false) {
  return apiDelete(
    `/api/custom-fields/category/${categoryId}/field/${fieldId}${confirm ? "?confirm=true" : ""}`
  );
}

// Deletes a field everywhere it's used.
export function deleteCustomField(fieldId, confirm = false) {
  return apiDelete(`/api/custom-fields/${fieldId}${confirm ? "?confirm=true" : ""}`);
}

export function fetchAvailableStock() {
  return apiGet("/api/stock/available");
}

export function assignEquipment(payload) {
  return apiPost("/api/stock/assign", payload);
}

export function unassignEquipment(target, status = "Working - IT Stock") {
  const payload =
    target && typeof target === "object" && !Array.isArray(target)
      ? { ...target }
      : Array.isArray(target)
        ? { equipment_ids: target }
        : { equipment_id: target };

  return apiPost("/api/equipment/unassign", { ...payload, status: payload.status || status });
}
