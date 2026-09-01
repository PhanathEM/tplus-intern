import { apiGet, apiPost, apiPut, apiDelete } from "../lib/apiClient";

// Same shape as equipment statuses, except there's no is_assignable here —
// parts don't get assigned to people, only borrowed, so only is_borrowable
// applies.
export function fetchPartStatuses(includeInactive = false) {
  return apiGet(`/api/part-statuses${includeInactive ? "?include_inactive=true" : ""}`);
}

export function fetchPartStatus(statusId) {
  return apiGet(`/api/part-statuses/${statusId}`);
}

export function createPartStatus(payload) {
  return apiPost("/api/part-statuses", payload);
}

export function updatePartStatus(statusId, payload) {
  return apiPut(`/api/part-statuses/${statusId}`, payload);
}

// Blocked with a 409 by the backend if any part stock still uses this status.
export function deletePartStatus(statusId) {
  return apiDelete(`/api/part-statuses/${statusId}`);
}
