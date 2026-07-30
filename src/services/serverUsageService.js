import { apiGet } from "../lib/apiClient";

export function fetchServerUsage() {
  return apiGet("/api/server-usage");
}
