import { apiGet } from "../lib/apiClient";

export function fetchPartTypes() {
  return apiGet("/api/part-types");
}
