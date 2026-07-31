import { apiPost } from "../lib/apiClient";

export function login(username, password) {
  return apiPost("/api/auth/login", { username, password }, { skipCredentials: true });
}

export function signup({ fullName, username, password }) {
  return apiPost(
    "/api/auth/signup",
    { full_name: fullName, username, password },
    { skipCredentials: true }
  );
}
