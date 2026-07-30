import { apiPost } from "../lib/apiClient";

export function login(username, password) {
  return apiPost("/api/auth/login", { username, password }, { skipCredentials: true });
}
