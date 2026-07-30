import { apiGet } from "../lib/apiClient";

export function fetchEmployees() {
  return apiGet("/api/employees");
}

export function searchEmployees(name) {
  const params = new URLSearchParams({ name });
  return apiGet(`/api/employees/search?${params.toString()}`);
}
