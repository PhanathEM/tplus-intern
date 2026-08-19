import { apiGet, apiPost, apiPut, apiDelete } from "../lib/apiClient";

export function fetchEmployees() {
  return apiGet("/api/employees");
}

export function searchEmployees(name) {
  const params = new URLSearchParams({ name });
  return apiGet(`/api/employees/search?${params.toString()}`);
}

// Returns { employee, equipment: [{ equipment_id, category, columns, item, licenses }] } —
// authoritative per-device column headers and license data, keyed by employee_id
// rather than a fragile name match.
export function fetchEmployeeFull(employeeId) {
  return apiGet(`/api/employees/${employeeId}/full`);
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

export function deleteEmployee(employeeId) {
  return apiDelete(`/api/employees/${employeeId}`);
}
