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

export function fetchBorrowHistory(filters = {}) {
  const params = new URLSearchParams();
  if (filters.equipment_id) params.set("equipment_id", filters.equipment_id);
  if (filters.borrower_id) params.set("borrower_id", filters.borrower_id);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const query = params.toString();
  return apiGet(`/api/borrow/history${query ? `?${query}` : ""}`);
}
