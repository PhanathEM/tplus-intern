import { apiGet, apiPost } from "../lib/apiClient";

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

export function fetchAvailableStock() {
  return apiGet("/api/stock/available");
}

export function assignEquipment(payload) {
  return apiPost("/api/stock/assign", payload);
}
