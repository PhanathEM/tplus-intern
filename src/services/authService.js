import { apiGet, apiPost } from "../lib/apiClient";

export function login(username, password) {
  return apiPost("/api/auth/login", { username, password }, { skipCredentials: true });
}

// Fresh copy of the logged-in user's own record (user_id, username,
// full_name, role) — used by the "View profile" panel so it doesn't rely
// solely on whatever was cached in local state at login time.
export function fetchCurrentUser() {
  return apiGet("/api/auth/me");
}

export function signup({ fullName, username, password }) {
  return apiPost(
    "/api/auth/signup",
    { full_name: fullName, username, password },
    { skipCredentials: true }
  );
}
