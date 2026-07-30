import { apiGet, apiPost, apiPut, apiDelete } from "../lib/apiClient";

export function fetchCategories() {
  return apiGet("/api/categories");
}

export function createCategory(payload) {
  return apiPost("/api/categories", payload);
}

export function updateCategory(categoryId, payload) {
  return apiPut(`/api/categories/${categoryId}`, payload);
}

export function deleteCategory(categoryId) {
  return apiDelete(`/api/categories/${categoryId}`);
}

export default {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
