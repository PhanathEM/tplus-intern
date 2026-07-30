import { apiGet } from "../lib/apiClient";

export function fetchReplacements() {
  return apiGet("/api/replacements/");
}
