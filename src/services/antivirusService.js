import { apiGet } from "../lib/apiClient";

export function fetchAntivirusInstalls() {
  return apiGet("/api/antivirus");
}
