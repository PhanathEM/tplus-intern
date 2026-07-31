import { apiGet, apiPost, apiPut } from "../lib/apiClient";

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

export function createEquipment(payload) {
  return apiPost("/api/stock/add", payload);
}

export function updateEquipment(equipmentId, payload) {
  return apiPut(`/api/equipment/${equipmentId}`, payload);
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
