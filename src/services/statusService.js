import { apiGet, apiPost, apiPut, apiDelete } from "../lib/apiClient";

export function fetchStatuses(includeInactive = false) {
  return apiGet(`/api/statuses${includeInactive ? "?include_inactive=true" : ""}`);
}

export function createStatus(payload) {
  return apiPost("/api/statuses", payload);
}

export function updateStatus(statusId, payload) {
  return apiPut(`/api/statuses/${statusId}`, payload);
}

export function deleteStatus(statusId) {
  return apiDelete(`/api/statuses/${statusId}`);
}
