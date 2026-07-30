const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const TOKEN_STORAGE_KEY = "tplus_auth_token";

// TODO: several GET endpoints (equipment categories, employee search) currently
// require these on every request instead of trusting the logged-in session.
// Remove once the backend accepts the session/token instead.
const TEMP_API_USERNAME = "Tplus";
const TEMP_API_PASSWORD = "Tplus123@99";

function appendTempCredentials(path) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}username=${encodeURIComponent(TEMP_API_USERNAME)}&password=${encodeURIComponent(TEMP_API_PASSWORD)}`;
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

function buildHeaders(extraHeaders) {
  const headers = { Accept: "application/json", ...extraHeaders };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function handleResponse(response) {
  if (!response.ok) {
    let message = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const data = await response.json();
      message = data?.error || data?.message || message;
    } catch {
      // response wasn't JSON, fall back to the default message
    }
    throw new Error(message);
  }
  return response.json();
}

export async function apiGet(path) {
  const response = await fetch(`${API_BASE_URL}${appendTempCredentials(path)}`, {
    headers: buildHeaders(),
  });
  return handleResponse(response);
}

export async function apiPost(path, body, { skipCredentials = false } = {}) {
  const url = skipCredentials ? path : appendTempCredentials(path);
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: "POST",
    headers: buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  return handleResponse(response);
}

export async function apiPut(path, body, { skipCredentials = false } = {}) {
  const url = skipCredentials ? path : appendTempCredentials(path);
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: "PUT",
    headers: buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  return handleResponse(response);
}
