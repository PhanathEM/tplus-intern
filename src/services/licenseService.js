import { apiGet } from "../lib/apiClient";

export function fetchLicenses() {
  return apiGet("/api/licenses");
}
