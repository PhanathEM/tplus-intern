import { apiGet, apiPost, apiPut, apiDelete } from "../lib/apiClient";

export function fetchPartStock() {
  return apiGet("/api/part-stock");
}

export function addPartStock(payload) {
  return apiPost("/api/part-stock", payload);
}

export function updatePartStock(stockId, payload) {
  return apiPut(`/api/part-stock/${stockId}`, payload);
}

// The API refuses (409) while the line still has stock, suggesting the
// quantity be zeroed instead — ?confirm=true overrides that guard.
export function deletePartStock(stockId, { confirm = false } = {}) {
  return apiDelete(`/api/part-stock/${stockId}${confirm ? "?confirm=true" : ""}`);
}
