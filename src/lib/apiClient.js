const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const TOKEN_STORAGE_KEY = "tplus_auth_token";
const CREDENTIALS_STORAGE_KEY = "tplus_api_credentials";

// TODO: several GET endpoints (equipment categories, employee search) currently
// require these on every request instead of trusting the logged-in session.
// Remove once the backend accepts the session/token instead.
//
// These used to be a single hardcoded username/password baked into this
// file — meaning the moment anyone changed their real password (e.g. via
// Account settings), every request across the whole app started failing
// with 401s for everyone, since the hardcoded pair no longer matched what
// the backend actually had on file. Now captured fresh at login instead
// (see setStoredCredentials calls in login.jsx and useAccount.js), so a
// changed password keeps working automatically instead of needing a code
// change here.
export function getStoredCredentials() {
  try {
    const raw = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredCredentials(username, password) {
  if (username && password) {
    localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify({ username, password }));
  } else {
    localStorage.removeItem(CREDENTIALS_STORAGE_KEY);
  }
}

function appendTempCredentials(path) {
  const stored = getStoredCredentials();
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}username=${encodeURIComponent(stored?.username || "")}&password=${encodeURIComponent(stored?.password || "")}`;
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
    let data = null;
    try {
      data = await response.json();
      message = data?.error || data?.message || message;
    } catch {
      // response wasn't JSON, fall back to the default message
    }
    const error = new Error(message);
    error.status = response.status;
    error.response = { status: response.status, data };
    throw error;
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
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

export async function apiPatch(path, body, { skipCredentials = false } = {}) {
  const url = skipCredentials ? path : appendTempCredentials(path);
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: "PATCH",
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

export async function apiDelete(path, { skipCredentials = false } = {}) {
  const url = skipCredentials ? path : appendTempCredentials(path);
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });
  return handleResponse(response);
}
