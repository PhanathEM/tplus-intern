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

// email is accepted by the endpoint (no error), but the 201 response never
// echoes it back the way it does username/full_name/role — a strong signal
// backend isn't storing it yet. Sending it anyway so accounts are ready to
// have a real email on file the moment backend does persist it.
export function signup({ fullName, username, email, password }) {
  return apiPost(
    "/api/auth/signup",
    { full_name: fullName, username, email, password },
    { skipCredentials: true }
  );
}

// Both pre-auth, like login/signup — no credentials to attach yet. Paths and
// body shape are provisional pending backend actually building these (see
// the "Need: real self-service forgot password flow" spec); update if
// backend's real endpoints differ.
export function requestPasswordReset(username) {
  return apiPost("/api/auth/forgot-password", { username }, { skipCredentials: true });
}

export function confirmPasswordReset(token, newPassword) {
  return apiPost("/api/auth/reset-password", { token, new_password: newPassword }, { skipCredentials: true });
}
