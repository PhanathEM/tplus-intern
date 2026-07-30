import { apiGet } from "../lib/apiClient";

export function fetchCloudRates() {
  return apiGet("/api/cloud-rates");
}
