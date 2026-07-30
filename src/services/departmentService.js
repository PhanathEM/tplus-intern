import { apiGet, apiPost, apiPut, apiDelete } from "../lib/apiClient";

export function fetchDepartments() {
  return apiGet("/api/departments");
}

export function createDepartment(payload) {
  return apiPost("/api/departments", payload);
}

export function updateDepartment(departmentId, payload) {
  return apiPut(`/api/departments/${departmentId}`, payload);
}

export function deleteDepartment(departmentId) {
  return apiDelete(`/api/departments/${departmentId}`);
}
