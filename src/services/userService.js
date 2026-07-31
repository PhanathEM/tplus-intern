import { apiGet, apiPost, apiPut } from "../lib/apiClient";

export function fetchUsers() {
  return apiGet("/api/users");
}

export function fetchUser(userId) {
  return apiGet(`/api/users/${userId}`);
}

export function updateUser(userId, payload) {
  return apiPut(`/api/users/${userId}`, payload);
}

export function resetUserPassword(userId, newPassword) {
  return apiPost(`/api/users/${userId}/reset-password`, { new_password: newPassword });
}
