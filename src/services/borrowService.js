import { apiGet, apiPost } from "../lib/apiClient";

export function createBorrow(payload) {
  return apiPost("/api/borrow", payload);
}

export function fetchCurrentBorrows() {
  return apiGet("/api/borrow/current");
}

export function returnBorrow(borrowId, payload) {
  return apiPost(`/api/borrow/${borrowId}/return`, payload);
}
