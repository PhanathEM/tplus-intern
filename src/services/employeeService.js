import { apiGet, apiPost, apiPut } from "../lib/apiClient";

export function fetchEmployees() {
  return apiGet("/api/employees");
}

export function searchEmployees(name) {
  const params = new URLSearchParams({ name });
  return apiGet(`/api/employees/search?${params.toString()}`);
}

// TODO: field names here (full_name, position, department, location, staff_code,
// phone, sex) are a best guess based on the GET /api/employees response shape.
// Not confirmed against the real POST/PUT body — verify with backend before relying on it.
export function createEmployee(payload) {
  return apiPost("/api/employees", payload);
}

export function updateEmployee(employeeId, payload) {
  return apiPut(`/api/employees/${employeeId}`, payload);
}
