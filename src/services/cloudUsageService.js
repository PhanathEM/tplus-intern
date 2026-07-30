import { apiGet } from "../lib/apiClient";

export function fetchCloudUsage() {
  return apiGet("/api/cloud-usage");
}
