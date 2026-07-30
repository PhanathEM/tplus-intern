import { apiGet } from "../lib/apiClient";

export function fetchSsdProcurement() {
  return apiGet("/api/ssd-procurement");
}
