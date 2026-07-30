import { apiGet } from "../lib/apiClient";

export function fetchDepartments() {
  return apiGet("/api/departments");
}
