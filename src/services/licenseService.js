import { apiGet, apiPost, apiPut, apiDelete } from "../lib/apiClient";

export function fetchLicenses() {
  return apiGet("/api/licenses");
}

export function createLicense(payload) {
  return apiPost("/api/licenses", payload);
}

export function updateLicense(licenseId, payload) {
  return apiPut(`/api/licenses/${licenseId}`, payload);
}

export function deleteLicense(licenseId) {
  return apiDelete(`/api/licenses/${licenseId}`);
}
